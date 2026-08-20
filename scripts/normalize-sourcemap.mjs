import { readFile, writeFile } from 'node:fs/promises'

const mapUrl = new URL('../client/client.js.map', import.meta.url)
const sourceMap = JSON.parse(await readFile(mapUrl, 'utf8'))

if (Array.isArray(sourceMap.sourcesContent)) {
  sourceMap.sourcesContent = sourceMap.sourcesContent.map(source =>
    typeof source === 'string' ? source.replace(/\r\n?/gu, '\n') : source,
  )
}

await writeFile(mapUrl, JSON.stringify(sourceMap))
