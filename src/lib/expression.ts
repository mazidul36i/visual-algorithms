// Safe math expression parser & compiler.
// Tokenizer -> recursive-descent parser -> AST -> closure compile.
// No eval / new Function — only whitelisted functions, constants, and variables.

export class ExpressionError extends Error {
  position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = 'ExpressionError';
    this.position = position;
  }
}

type TokenKind = 'number' | 'ident' | 'op' | 'lparen' | 'rparen';

interface Token {
  kind: TokenKind;
  value: string;
  position: number;
}

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log,
  ln: Math.log,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

export const SUPPORTED_FUNCTIONS = Object.keys(FUNCTIONS);
export const SUPPORTED_CONSTANTS = Object.keys(CONSTANTS);

type Evaluator = (vars: Record<string, number>) => number;

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      const value = src.slice(start, i);
      if (value === '.' || value.indexOf('.') !== value.lastIndexOf('.')) {
        throw new ExpressionError(`invalid number "${value}"`, start);
      }
      tokens.push({ kind: 'number', value, position: start });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) i++;
      tokens.push({ kind: 'ident', value: src.slice(start, i), position: start });
      continue;
    }

    if ('+-*/^'.includes(ch)) {
      tokens.push({ kind: 'op', value: ch, position: i });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen', value: ch, position: i });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ kind: 'rparen', value: ch, position: i });
      i++;
      continue;
    }

    throw new ExpressionError(`unexpected character "${ch}"`, i);
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  private allowedVars: string[];
  private srcLength: number;

  constructor(tokens: Token[], allowedVars: string[], srcLength: number) {
    this.tokens = tokens;
    this.allowedVars = allowedVars;
    this.srcLength = srcLength;
  }

  parse(): Evaluator {
    if (this.tokens.length === 0) {
      throw new ExpressionError('empty expression', 0);
    }
    const result = this.parseExpr();
    if (this.pos < this.tokens.length) {
      const tok = this.tokens[this.pos];
      throw new ExpressionError(`unexpected "${tok.value}"`, tok.position);
    }
    return result;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  // expr := term (('+' | '-') term)*
  private parseExpr(): Evaluator {
    let left = this.parseTerm();
    let tok = this.peek();
    while (tok && tok.kind === 'op' && (tok.value === '+' || tok.value === '-')) {
      this.next();
      const right = this.parseTerm();
      const l = left;
      left = tok.value === '+' ? (v) => l(v) + right(v) : (v) => l(v) - right(v);
      tok = this.peek();
    }
    return left;
  }

  // term := unary (('*' | '/') unary | implicit-mul)*
  private parseTerm(): Evaluator {
    let left = this.parseUnary();
    for (;;) {
      const tok = this.peek();
      if (tok && tok.kind === 'op' && (tok.value === '*' || tok.value === '/')) {
        this.next();
        const right = this.parseUnary();
        const l = left;
        left = tok.value === '*' ? (v) => l(v) * right(v) : (v) => l(v) / right(v);
        continue;
      }
      // Implicit multiplication: 2x, x sin(x), 3(x+1)
      if (tok && (tok.kind === 'ident' || tok.kind === 'number' || tok.kind === 'lparen')) {
        const right = this.parseUnary();
        const l = left;
        left = (v) => l(v) * right(v);
        continue;
      }
      return left;
    }
  }

  // unary := '-' unary | power
  private parseUnary(): Evaluator {
    const tok = this.peek();
    if (tok && tok.kind === 'op' && tok.value === '-') {
      this.next();
      const arg = this.parseUnary();
      return (v) => -arg(v);
    }
    if (tok && tok.kind === 'op' && tok.value === '+') {
      this.next();
      return this.parseUnary();
    }
    return this.parsePower();
  }

  // power := primary ('^' unary)?   — right-associative
  private parsePower(): Evaluator {
    const base = this.parsePrimary();
    const tok = this.peek();
    if (tok && tok.kind === 'op' && tok.value === '^') {
      this.next();
      const exponent = this.parseUnary();
      return (v) => Math.pow(base(v), exponent(v));
    }
    return base;
  }

  // primary := number | ident | ident '(' expr ')' | '(' expr ')'
  private parsePrimary(): Evaluator {
    const tok = this.next();
    if (!tok) {
      throw new ExpressionError('unexpected end of expression', this.srcLength);
    }

    if (tok.kind === 'number') {
      const value = parseFloat(tok.value);
      return () => value;
    }

    if (tok.kind === 'lparen') {
      const inner = this.parseExpr();
      const closing = this.next();
      if (!closing || closing.kind !== 'rparen') {
        throw new ExpressionError('missing closing ")"', closing?.position ?? this.srcLength);
      }
      return inner;
    }

    if (tok.kind === 'ident') {
      const name = tok.value.toLowerCase();

      // function call: ident '(' expr ')'
      const nextTok = this.peek();
      if (nextTok && nextTok.kind === 'lparen') {
        const fn = FUNCTIONS[name];
        if (!fn) {
          throw new ExpressionError(`unknown function "${tok.value}"`, tok.position);
        }
        this.next(); // consume '('
        const arg = this.parseExpr();
        const closing = this.next();
        if (!closing || closing.kind !== 'rparen') {
          throw new ExpressionError('missing closing ")"', closing?.position ?? this.srcLength);
        }
        return (v) => fn(arg(v));
      }

      if (name in CONSTANTS) {
        const value = CONSTANTS[name];
        return () => value;
      }

      if (this.allowedVars.includes(name)) {
        return (v) => v[name];
      }

      if (name in FUNCTIONS) {
        throw new ExpressionError(`"${tok.value}" needs parentheses, e.g. ${name}(x)`, tok.position);
      }

      throw new ExpressionError(
        `unknown identifier "${tok.value}" (allowed: ${this.allowedVars.join(', ')})`,
        tok.position
      );
    }

    throw new ExpressionError(`unexpected "${tok.value}"`, tok.position);
  }
}

/**
 * Compile a math expression into an evaluator function.
 * Throws ExpressionError (with character position) on invalid input.
 */
export function compileExpression(src: string, allowedVars: string[]): Evaluator {
  const tokens = tokenize(src);
  const vars = allowedVars.map((v) => v.toLowerCase());
  return new Parser(tokens, vars, src.length).parse();
}
