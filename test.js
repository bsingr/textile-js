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
