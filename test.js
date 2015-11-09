import test from 'ava'
import fs from 'fs'
import {textileToHtml, textileTokensToHtml, parseTextile, tokens} from './textile'

test('parse to html', t => {
  var expectedTokens = 'foo <strong>bar<sup> baz foo</sup></strong>'
  t.same(expectedTokens, textileTokensToHtml(['foo ', tokens['bold'][0], 'bar', tokens['up'][0], ' baz foo', tokens['up'][1], tokens['bold'][1]]))
  t.end()
})

test('parse', t => {
  var expectedTokens = ['foo ', tokens['bold'][0], 'bar', tokens['up'][0], ' baz foo', tokens['up'][1], tokens['bold'][1]]
  t.same(expectedTokens, parseTextile(['foo *bar^ baz foo^*']))
  t.end()
})

test('parse unclosed', t => {
  var expectedTokens = ['foo ', tokens['bold'][0], 'bar', ' baz foo', tokens['bold'][1]]
  t.same(expectedTokens, parseTextile(['foo *bar^ baz foo*']))
  t.end()
})

test('parse one-item list', t => {
  var expectedTokens = ['foo ', tokens['unordered_list_group'][0], tokens['unordered_list'][0], 'bar', tokens['unordered_list'][1], tokens['unordered_list_group'][1], ' baz foo']
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
    var expectedTokens = ['foo ', tokens['bold'][0], 'bar', tokens['bold'][1], ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('italic', t => {
    var actualTokens = parseTextile('foo _bar_ baz')
    var expectedTokens = ['foo ', tokens['italic'][0], 'bar', tokens['italic'][1], ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('up', t => {
    var actualTokens = parseTextile('foo ^bar^ baz')
    var expectedTokens = ['foo ', tokens['up'][0], 'bar', tokens['up'][1], ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('down', t => {
    var actualTokens = parseTextile('foo ~bar~ baz')
    var expectedTokens = ['foo ', tokens['down'][0], 'bar', tokens['down'][1], ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('line break', t => {
    var actualTokens = parseTextile('foo \nbar\n baz')
    var expectedTokens = ['foo ', tokens.line_break, 'bar', tokens.line_break, ' baz']
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('mixed phrase', t => {
    var actualTokens = parseTextile('*foo*~bar~*baz*')
    var expectedTokens = [tokens['bold'][0], 'foo', tokens['bold'][1], tokens['down'][0], 'bar', tokens['down'][1], tokens['bold'][0], 'baz', tokens['bold'][1]]
    t.same(expectedTokens, actualTokens)
    t.end()
})

test('list one unsorted', t => {
    var actualTokens = parseTextile('foo \n* bar\n* baz\n foo')
    var expectedTokens = ['foo ', tokens['unordered_list_group'][0], tokens['unordered_list'][0], 'bar', tokens['unordered_list'][1], tokens['unordered_list'][0], 'baz', tokens['unordered_list'][1], tokens['unordered_list_group'][1], ' foo']
    t.same(expectedTokens, actualTokens)
    t.end()
})
