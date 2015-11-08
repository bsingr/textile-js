(function(){
  var tokens = {
    start_bold: 10,
    end_bold: 11,
    start_up: 20,
    end_up: 21,
    line_break: 30,
    start_unordered_list: 40,
    end_unordered_list: 41,
    start_unordered_list_group: 50,
    end_unordered_list_group: 51,
    start_down: 60,
    end_down: 61,
    start_italic: 70,
    end_italic: 71
  }

  function parseTextile(fullText) {
    var text = ''+fullText
    var stack = []
    var token = new RegExp("(\n\\* |\\*|\\^|\n|\\~|\\_)")
    var context = {
      bold: -1,
      up: -1,
      down: -1,
      italic: -1,
      unorderedListOne: -1,
      unorderedListOneGroup: -1,
    }
    var idx = -1
    while(true) {
      idx = text.search(token)
      if (idx > -1) {
        if (idx > 0) { // starts with non-token text
          stack.push(text.substr(0, idx))
        }
        if (text.substr(idx, 3) == '\n* ') {
          if (!tryStartBlock(context, stack, 'unorderedListOneGroup', tokens.start_unordered_list_group, tokens.end_unordered_list_group)) {
            tryEndBlock(context, stack, 'unorderedListOne', tokens.start_unordered_list, tokens.end_unordered_list)
          }
          stack.push(-tokens.start_unordered_list)
          context.unorderedListOne = stack.length-1
          text = text.substr(idx + 3)
        } else if (text.substr(idx, 1) == '\n') {
          tryEndBlock(context, stack, 'unorderedListOne', tokens.start_unordered_list, tokens.end_unordered_list)
          if (!tryEndBlock(context, stack, 'unorderedListOneGroup', tokens.start_unordered_list_group, tokens.end_unordered_list_group)) {
            stack.push(tokens.line_break)
          }
          text = text.substr(idx + 1)
        } else if (text.substr(idx, 1) == '*') {
          if (!tryEndBlock(context, stack, 'bold', tokens.start_bold, tokens.end_bold)) {
            tryStartBlock(context, stack, 'bold', tokens.start_bold, tokens.end_bold)
          }
          text = text.substr(idx + 1)
        } else if (text.substr(idx, 1) == '_') {
          if (!tryEndBlock(context, stack, 'italic', tokens.start_italic, tokens.end_italic)) {
            tryStartBlock(context, stack, 'italic', tokens.start_italic, tokens.end_italic)
          }
          text = text.substr(idx + 1)
        } else if (text.substr(idx, 1) == '^') {
          if (!tryEndBlock(context, stack, 'up', tokens.start_up, tokens.end_up)) {
            tryStartBlock(context, stack, 'up', tokens.start_up, tokens.end_up)
          }
          text = text.substr(idx + 1)
        } else if (text.substr(idx, 1) == '~') {
          if (!tryEndBlock(context, stack, 'down', tokens.start_down, tokens.end_down)) {
            tryStartBlock(context, stack, 'down', tokens.start_down, tokens.end_down)
          }
          text = text.substr(idx + 1)
        }
      } else {
        if (text.length) { // remaining non-token text
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
  tokenToHtml[''+tokens.line_break] = '<br/>'
  tokenToHtml[''+tokens.start_bold] = '<strong>'
  tokenToHtml[''+tokens.end_bold] = '</strong>'
  tokenToHtml[''+tokens.start_italic] = '<em>'
  tokenToHtml[''+tokens.end_italic] = '</em>'
  tokenToHtml[''+tokens.start_up] = '<sup>'
  tokenToHtml[''+tokens.end_up] = '</sup>'
  tokenToHtml[''+tokens.start_down] = '<sub>'
  tokenToHtml[''+tokens.end_down] = '</sub>'
  tokenToHtml[''+tokens.start_unordered_list] = '<li>'
  tokenToHtml[''+tokens.end_unordered_list] = '</li>'
  tokenToHtml[''+tokens.start_unordered_list_group] = '<ul>'
  tokenToHtml[''+tokens.end_unordered_list_group] = '</ul>'

  function textileTokensToHtml(tokens) {
    var html = []
    var idx = 0
    var token
    for (idx = 0; idx < tokens.length; idx++) {
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
