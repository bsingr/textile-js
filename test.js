import test from 'ava'
import fs from 'fs'

var SYM_BOLD = 0,
    SYM_UP = 1

function scan(stack, text) {
  var token = new RegExp("(\\*|\\^)")
  var idx = text.search(token)
  if (idx > -1) {
    if (idx > 0) {
      stack.push(text.substr(0, idx))
    }
    if (text.substr(idx, 1) == '*') {
      stack.push(SYM_BOLD)
    } else if (text.substr(idx, 1) == '^') {
      stack.push(SYM_UP)
    }
    scan(stack, text.substr(idx + 1))
  } else if (text.length) {
    stack.push(text)
  }
  return stack;
}

var START_BOLD = 10,
    END_BOLD = 11,
    START_UP = 12,
    END_UP = 13

function parseToken(context, parsedTokens, idx, key, start, end) {
  if (context[key] > -1) {
    parsedTokens[context[key]] = start
    parsedTokens.push(end)
    context[key] = -1
  } else {
    parsedTokens.push(-1)
    context[key] = idx
  }
}

function parse(tokens) {
  var parsedTokens = []
  var context = {
    bold: -1,
    up: -1
  }
  for (let idx = 0; idx < tokens.length; idx++) {
    let token = tokens[idx]
    if (typeof token === 'string') {
      parsedTokens.push(token)
    } else {
      if (token === SYM_BOLD) {
        parseToken(context, parsedTokens, idx, 'bold', START_BOLD, END_BOLD)
      } else if (token === SYM_UP) {
        parseToken(context, parsedTokens, idx, 'up', START_UP, END_UP)
      }
    }
  }
  var parsedCleanedTokens = []
  for (let idx = 0; idx < parsedTokens.length; idx++) {
    let token = parsedTokens[idx]
    if (token !== -1) {
      parsedCleanedTokens.push(token)
    }
  }
  return parsedCleanedTokens
}

var tokenToHtml = {}
tokenToHtml[''+START_BOLD] = '<strong>'
tokenToHtml[''+END_BOLD] = '</strong>'
tokenToHtml[''+START_UP] = '<sup>'
tokenToHtml[''+END_UP] = '</sup>'

function toHtml(tokens) {
  var html = []
  for (let idx = 0; idx < tokens.length; idx++) {
    let token = tokens[idx]
    if (typeof token === 'number') {
      html.push(tokenToHtml[''+token])
    } else {
      html.push(token)
    }
  }
  return html.join('')
}

test('parse to html', t => {
  var expectedTokens = 'foo <strong>bar<sup> baz foo</sup></strong>'
  t.same(expectedTokens, toHtml(['foo ', START_BOLD, 'bar', START_UP, ' baz foo', END_UP, END_BOLD]))
  t.end()
})

test('parse', t => {
  var expectedTokens = ['foo ', START_BOLD, 'bar', START_UP, ' baz foo', END_UP, END_BOLD]
  t.same(expectedTokens, parse(['foo ', SYM_BOLD, 'bar', SYM_UP, ' baz foo', SYM_UP, SYM_BOLD]))
  t.end()
})

test('parse unclosed', t => {
  var expectedTokens = ['foo ', START_BOLD, 'bar', ' baz foo', END_BOLD]
  t.same(expectedTokens, parse(['foo ', SYM_BOLD, 'bar', SYM_UP, ' baz foo', SYM_BOLD]))
  t.end()
})

test('file', t => {
    var test = fs.readFileSync(__dirname+'/test.tx', 'utf8').trim()
    var tokens = scan([], test)
    var expectedTokens = ['foo ', SYM_BOLD, 'bar', SYM_UP, ' baz foo', SYM_UP, SYM_BOLD]
    t.same(expectedTokens, tokens)
    t.end()
})

test('bold', t => {
    var tokens = scan([], 'foo *bar* baz')
    var expectedTokens = ['foo ', SYM_BOLD, 'bar', SYM_BOLD, ' baz']
    t.same(expectedTokens, tokens)
    t.end()
})

test('up', t => {
    var tokens = scan([], 'foo ^bar^ baz')
    var expectedTokens = ['foo ', SYM_UP, 'bar', SYM_UP, ' baz']
    t.same(expectedTokens, tokens)
    t.end()
})
