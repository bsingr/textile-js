(function(){
  var tokens = {
    bold: [10, 11],
    up: [20, 21],
    line_break: 30,
    unordered_list: [40, 41],
    unordered_list_group: [50, 51],
    down: [60, 61],
    italic: [70, 71]
  },
  inputTokens = {
    bold: '*',
    italic: '_',
    up: '^',
    down: '~'
  },
  tokenToHtml = {}
  tokenToHtml[''+tokens.line_break] = '<br/>'
  tokenToHtml[''+tokens['bold'][0]] = '<strong>'
  tokenToHtml[''+tokens['bold'][1]] = '</strong>'
  tokenToHtml[''+tokens['italic'][0]] = '<em>'
  tokenToHtml[''+tokens['italic'][1]] = '</em>'
  tokenToHtml[''+tokens['up'][0]] = '<sup>'
  tokenToHtml[''+tokens['up'][1]] = '</sup>'
  tokenToHtml[''+tokens['down'][0]] = '<sub>'
  tokenToHtml[''+tokens['down'][1]] = '</sub>'
  tokenToHtml[''+tokens['unordered_list'][0]] = '<li>'
  tokenToHtml[''+tokens['unordered_list'][1]] = '</li>'
  tokenToHtml[''+tokens['unordered_list_group'][0]] = '<ul>'
  tokenToHtml[''+tokens['unordered_list_group'][1]] = '</ul>'

  function parseTextile(fullText) {
    var text = ''+fullText
    var stack = []
    var token = new RegExp("(\n\\* |\\*|\\^|\n|\\~|\\_)")
    var context = {
      bold: -1,
      up: -1,
      down: -1,
      italic: -1,
      unordered_list: -1,
      unordered_list_group: -1,
    }
    var idx = -1
    while(true) {
      idx = text.search(token)
      if (idx > -1) {
        if (idx > 0) { // starts with non-token text
          stack.push(text.substr(0, idx))
        }
        if (text.substr(idx, 3) == '\n* ') {
          if (!tryStartBlock(context, stack, 'unordered_list_group')) {
            tryEndBlock(context, stack, 'unordered_list')
          }
          stack.push(-tokens.start_unordered_list)
          context.unordered_list = stack.length-1
          text = text.substr(idx + 3)
        } else if (text.substr(idx, 1) == '\n') {
          tryEndBlock(context, stack, 'unordered_list')
          if (!tryEndBlock(context, stack, 'unordered_list_group')) {
            stack.push(tokens.line_break)
          }
          text = text.substr(idx + 1)
        } else if (tryBlock(text, idx, context, stack, 'bold')) {
          text = text.substr(idx + 1)
        } else if (tryBlock(text, idx, context, stack, 'italic')) {
          text = text.substr(idx + 1)
        } else if (tryBlock(text, idx, context, stack, 'up')) {
          text = text.substr(idx + 1)
        } else if (tryBlock(text, idx, context, stack, 'down')) {
          text = text.substr(idx + 1)
        }
      } else {
        if (text.length > 0) { // remaining non-token text
          stack.push(text)
        }
        break
      }
    }
    var cleanedStack = []
    var token
    for (idx = 0; idx < stack.length; idx++) {
      token = stack[idx]
      if (typeof token === 'string' || token > -1) {
        cleanedStack.push(token)
      }
    }
    return cleanedStack
  }

  function tryEndBlock(context, stack, key) {
    if (context[key] > -1) {
      stack[context[key]] = tokens[key][0]
      stack.push(tokens[key][1])
      context[key] = -1
      return true
    }
  }

  function tryStartBlock(context, stack, key) {
    if (context[key] === -1) {
      stack.push(-tokens[key][0])
      context[key] = stack.length-1
      return true
    }
  }

  function tryBlock(text, idx, context, stack, key) {
    if (text.substr(idx, 1) == inputTokens[key]) {
      if (!tryEndBlock(context, stack, key)) {
        tryStartBlock(context, stack, key)
      }
      return true
    }
  }

  function textileTokensToHtml(tokens) {
    var html = []
    var token
    for (var idx = 0; idx < tokens.length; idx++) {
      token = tokens[idx]
      if (typeof token === 'number') {
        html.push(tokenToHtml[''+token])
      } else {
        html.push(token)
      }
    }
    return html.join('')
  }

  function textileToHtml(text) {
    return textileTokensToHtml(parseTextile(text))
  }

  if (typeof exports === 'object') {
    exports.textileToHtml = textileToHtml
    exports.textileTokensToHtml = textileTokensToHtml
    exports.parseTextile = parseTextile
    exports.tokens = tokens
  }
  if (typeof window === 'object') {
    window.textileToHtml = textileToHtml
  }
})()
