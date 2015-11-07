import test from 'ava'
import fs from 'fs'

var START_BOLD = 10,
    END_BOLD = 11,
    START_UP = 20,
    END_UP = 21,
    LINE_BREAK = 30,
    START_UNORDERED_LIST_ONE = 40,
    END_UNORDERED_LIST_ONE = 41,
    START_UNORDERED_LIST_ONE_GROUP = 50,
    END_UNORDERED_LIST_ONE_GROUP = 51

function parseTextile(fullText) {
  let text = ''+fullText
  let stack = []
  let token = new RegExp("(\n\\* |\\*|\\^|\n)")
  let context = {
    bold: -1,
    up: -1,
    unorderedListOne: -1,
    unorderedListOneGroup: -1
  }
  while(true) {
    let idx = text.search(token)
    if (idx > -1) {
      if (idx > 0) { // starts with non-token text
        stack.push(text.substr(0, idx))
      }
      if (text.substr(idx, 3) == '\n* ') {
        if (!tryStartBlock(context, stack, 'unorderedListOneGroup', START_UNORDERED_LIST_ONE_GROUP, END_UNORDERED_LIST_ONE_GROUP)) {
          tryEndBlock(context, stack, 'unorderedListOne', START_UNORDERED_LIST_ONE, END_UNORDERED_LIST_ONE)
        }
        stack.push(-START_UNORDERED_LIST_ONE)
        context.unorderedListOne = stack.length-1
        text = text.substr(idx + 3)
      } else if (text.substr(idx, 1) == '\n') {
        tryEndBlock(context, stack, 'unorderedListOne', START_UNORDERED_LIST_ONE, END_UNORDERED_LIST_ONE)
        if (!tryEndBlock(context, stack, 'unorderedListOneGroup', START_UNORDERED_LIST_ONE_GROUP, END_UNORDERED_LIST_ONE_GROUP)) {
          stack.push(LINE_BREAK)
        }
        text = text.substr(idx + 1)
      } else if (text.substr(idx, 1) == '*') {
        tryEndBlock(context, stack, 'bold', START_BOLD, END_BOLD)
        tryStartBlock(context, stack, 'bold', START_BOLD, END_BOLD)
        text = text.substr(idx + 1)
      } else if (text.substr(idx, 1) == '^') {
        tryEndBlock(context, stack, 'up', START_UP, END_UP)
        tryStartBlock(context, stack, 'up', START_UP, END_UP)
        text = text.substr(idx + 1)
      }
    } else {
      if (text.length) { // remaining non-token text
        stack.push(text)
      }
      break
    }
  }
  let cleanedStack = []
  for (let idx = 0; idx < stack.length; idx++) {
    let token = stack[idx]
    if (typeof token === 'string' || token > -1) {
      cleanedStack.push(token)
    }
  }
  return cleanedStack
}

function tryEndBlock(context, stack, key, start, end) {
  if (context[key] > -1) {
    stack[context[key]] = start
    stack.push(end)
    context[key] = -1
    return true
  }
}

function tryStartBlock(context, stack, key, start, end) {
  if (context[key] === -1) {
    stack.push(-start)
    context[key] = stack.length-1
    return true
  }
}

var tokenToHtml = {}
tokenToHtml[''+LINE_BREAK] = '<br/>'
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
  return toHtml(parseTextile(text))
}

test('parse to html', t => {
  var expectedTokens = 'foo <strong>bar<sup> baz foo</sup></strong>'
  t.same(expectedTokens, toHtml(['foo ', START_BOLD, 'bar', START_UP, ' baz foo', END_UP, END_BOLD]))
  t.end()
})

test('parse', t => {
  var expectedTokens = ['foo ', START_BOLD, 'bar', START_UP, ' baz foo', END_UP, END_BOLD]
  t.same(expectedTokens, parseTextile(['foo *bar^ baz foo^*']))
  t.end()
})

test('parse unclosed', t => {
  var expectedTokens = ['foo ', START_BOLD, 'bar', ' baz foo', END_BOLD]
  t.same(expectedTokens, parseTextile(['foo *bar^ baz foo*']))
  t.end()
})

test('parse one-item list', t => {
  var expectedTokens = ['foo ', START_UNORDERED_LIST_ONE_GROUP, START_UNORDERED_LIST_ONE, 'bar', END_UNORDERED_LIST_ONE, END_UNORDERED_LIST_ONE_GROUP, ' baz foo']
  t.same(expectedTokens, parseTextile(['foo \n* bar\n baz foo']))
  t.end()
})

test('file to html', t => {
    var text = fs.readFileSync(__dirname+'/test.tx', 'utf8')
    var html = textToHtml(text)
    var expectedHtml = 'foo <strong>bar<sup> baz foo</sup></strong><ul><li>baz</li><li>boz</li></ul><br/>foo<br/>'
    t.same(expectedHtml, html)
    t.end()
})

test('bold', t => {
    var tokens = parseTextile('foo *bar* baz')
    var expectedTokens = ['foo ', START_BOLD, 'bar', END_BOLD, ' baz']
    t.same(expectedTokens, tokens)
    t.end()
})

test('up', t => {
    var tokens = parseTextile('foo ^bar^ baz')
    var expectedTokens = ['foo ', START_UP, 'bar', END_UP, ' baz']
    t.same(expectedTokens, tokens)
    t.end()
})

test('linebreak', t => {
    var tokens = parseTextile('foo \nbar\n baz')
    var expectedTokens = ['foo ', LINE_BREAK, 'bar', LINE_BREAK, ' baz']
    t.same(expectedTokens, tokens)
    t.end()
})

test('list one unsorted', t => {
    var tokens = parseTextile('foo \n* bar\n* baz\n foo')
    var expectedTokens = ['foo ', START_UNORDERED_LIST_ONE_GROUP, START_UNORDERED_LIST_ONE, 'bar', END_UNORDERED_LIST_ONE, START_UNORDERED_LIST_ONE, 'baz', END_UNORDERED_LIST_ONE, END_UNORDERED_LIST_ONE_GROUP, ' foo']
    t.same(expectedTokens, tokens)
    t.end()
})
