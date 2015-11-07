import test from 'ava'
import fs from 'fs'

var SYM_BOLD = 0,
    SYM_UP = 1,
    SYM_LIST_ONE_UNSORTED = 2,
    SIMPLE_LINEBREAK = 3

function scan(stack, text) {
  var token = new RegExp("(\n\\* |\\*|\\^|\n)")
  var idx = text.search(token)
  if (idx > -1) {
    if (idx > 0) {
      stack.push(text.substr(0, idx))
    }
    if (text.substr(idx, 3) == '\n* ') {
      stack.push(SYM_LIST_ONE_UNSORTED)
      scan(stack, text.substr(idx + 3))
    } else if (text.substr(idx, 1) == '\n') {
      stack.push(SIMPLE_LINEBREAK)
      scan(stack, text.substr(idx + 1))
    } else if (text.substr(idx, 1) == '*') {
      stack.push(SYM_BOLD)
      scan(stack, text.substr(idx + 1))
    } else if (text.substr(idx, 1) == '^') {
      stack.push(SYM_UP)
      scan(stack, text.substr(idx + 1))
    }
  } else if (text.length) {
    stack.push(text)
  }
  return stack
}

var START_BOLD = 10,
    END_BOLD = 11,
    START_UP = 12,
    END_UP = 13,
    LINE_BREAK = 14,
    START_UNORDERED_LIST_ONE = 15,
    END_UNORDERED_LIST_ONE = 16,
    START_UNORDERED_LIST_ONE_GROUP = 17,
    END_UNORDERED_LIST_ONE_GROUP = 18

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
    up: -1,
    unorderedListOne: -1,
    unorderedListOneGroup: -1
  }
  var targetIdx = 0;
  for (let idx = 0; idx < tokens.length; idx++) {
    let token = tokens[idx]
    if (typeof token === 'string') {
      parsedTokens.push(token)
    } else {
      if (token === SYM_BOLD) {
        parseToken(context, parsedTokens, targetIdx, 'bold', START_BOLD, END_BOLD)
      } else if (token === SYM_UP) {
        parseToken(context, parsedTokens, targetIdx, 'up', START_UP, END_UP)
      } else if (token === SYM_LIST_ONE_UNSORTED) {
        if (context.unorderedListOneGroup === -1) {
          context.unorderedListOneGroup = targetIdx
          parsedTokens.push(-1)
          targetIdx++
        } else {
          parsedTokens[context.unorderedListOne] = START_UNORDERED_LIST_ONE
          parsedTokens.push(END_UNORDERED_LIST_ONE)
          targetIdx++
        }
        context.unorderedListOne = targetIdx
        parsedTokens.push(-1)
      } else if (token === SIMPLE_LINEBREAK) {
        if (context.unorderedListOneGroup > 0) {
          if (context.unorderedListOne > 0) {
            parsedTokens[context.unorderedListOne] = START_UNORDERED_LIST_ONE
            parsedTokens.push(END_UNORDERED_LIST_ONE)
            targetIdx++
          }
          parsedTokens[context.unorderedListOneGroup] = START_UNORDERED_LIST_ONE_GROUP
          parsedTokens.push(END_UNORDERED_LIST_ONE_GROUP)
        }
      }
    }
    targetIdx++
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
tokenToHtml[''+START_UNORDERED_LIST_ONE] = '<li>'
tokenToHtml[''+END_UNORDERED_LIST_ONE] = '</li>'
tokenToHtml[''+START_UNORDERED_LIST_ONE_GROUP] = '<ul>'
tokenToHtml[''+END_UNORDERED_LIST_ONE_GROUP] = '</ul>'

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

function textToHtml(text) {
  var tokens = scan([], text)
  return toHtml(parse(tokens))
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

test('parse list', t => {
  var expectedTokens = ['foo ', START_UNORDERED_LIST_ONE_GROUP, START_UNORDERED_LIST_ONE, 'bar', END_UNORDERED_LIST_ONE, END_UNORDERED_LIST_ONE_GROUP, ' baz foo']
  t.same(expectedTokens, parse(['foo ', SYM_LIST_ONE_UNSORTED, 'bar', SIMPLE_LINEBREAK, ' baz foo']))
  t.end()
})

test('html file', t => {
    var text = fs.readFileSync(__dirname+'/test.tx', 'utf8')
    var html = textToHtml(text)
    var expectedHtml = 'foo <strong>bar<sup> baz foo</sup></strong><ul><li>baz</li><li>boz</li></ul>'
    t.same(expectedHtml, html)
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

test('list one unsorted', t => {
    var tokens = scan([], 'foo \n* bar\n* baz\n foo')
    var expectedTokens = ['foo ', SYM_LIST_ONE_UNSORTED, 'bar', SYM_LIST_ONE_UNSORTED, 'baz', SIMPLE_LINEBREAK, ' foo']
    t.same(expectedTokens, tokens)
    t.end()
})
