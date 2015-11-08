import test from 'ava'
import fs from 'fs'
import {textileToHtml, textileTokensToHtml, parseTextile, tokens} from './textile'

test('parse to html', t => {
  var expectedTokens = 'foo <strong>bar<sup> baz foo</sup></strong>'
  t.same(expectedTokens, textileTokensToHtml(['foo ', tokens.start_bold, 'bar', tokens.start_up, ' baz foo', tokens.end_up, tokens.end_bold]))
  t.end()
})

test('parse', t => {
  var expectedTokens = ['foo ', tokens.start_bold, 'bar', tokens.start_up, ' baz foo', tokens.end_up, tokens.end_bold]
  t.same(expectedTokens, parseTextile(['foo *bar^ baz foo^*']))
  t.end()
})

test('parse unclosed', t => {
  var expectedTokens = ['foo ', tokens.start_bold, 'bar', ' baz foo', tokens.end_bold]
  t.same(expectedTokens, parseTextile(['foo *bar^ baz foo*']))
  t.end()
})

test('parse one-item list', t => {
  var expectedTokens = ['foo ', tokens.start_unordered_list_group, tokens.start_unordered_list, 'bar', tokens.end_unordered_list, tokens.end_unordered_list_group, ' baz foo']
  t.same(expectedTokens, parseTextile(['foo \n* bar\n baz foo']))
  t.end()
})

test('file to html', t => {
    var text = fs.readFileSync(__dirname+'/test.tx', 'utf8')
    var html = textileToHtml(text)
    var expectedHtml = 'foo <strong>bar<sup> baz foo</sup></strong><ul><li>baz</li><li>boz</li></ul><br/>foo<br/>'
    t.same(expectedHtml, html)
    t.end()
})

test('bold', t => {
    var actualTokens = parseTextile('foo *bar* baz')
    var expectedTokens = ['foo ', tokens.start_bold, 'bar', tokens.end_bold, ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('up', t => {
    var actualTokens = parseTextile('foo ^bar^ baz')
    var expectedTokens = ['foo ', tokens.start_up, 'bar', tokens.end_up, ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('line break', t => {
    var actualTokens = parseTextile('foo \nbar\n baz')
    var expectedTokens = ['foo ', tokens.line_break, 'bar', tokens.line_break, ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('list one unsorted', t => {
    var actualTokens = parseTextile('foo \n* bar\n* baz\n foo')
    var expectedTokens = ['foo ', tokens.start_unordered_list_group, tokens.start_unordered_list, 'bar', tokens.end_unordered_list, tokens.start_unordered_list, 'baz', tokens.end_unordered_list, tokens.end_unordered_list_group, ' foo']
    t.same(expectedTokens, actualTokens)
    t.end()
})
