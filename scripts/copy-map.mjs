import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = resolve('src/Map')
const target = resolve('dist/Map')

await mkdir(target, { recursive: true })
await cp(source, target, { recursive: true, force: true })
// Include the standalone services catalog and its existing request steps.
await cp(resolve('src/services'), resolve('dist/Services'), { recursive: true, force: true })
// Publish the standalone real-estate projects from their source folder.
await cp(resolve('src/projects'), resolve('dist/projects'), { recursive: true, force: true })
// Keep the standalone map on the same header stylesheet and brand assets as React.
await cp(resolve('src/header.css'), resolve('dist/header.css'))
await cp(resolve('src/portal-header.css'), resolve('dist/portal-header.css'))
await cp(resolve('src/portal-header.js'), resolve('dist/portal-header.js'))
await cp(resolve('src/login-transition.js'), resolve('dist/login-transition.js'))
await cp(resolve('src/chatbot.js'), resolve('dist/chatbot.js'))
await mkdir(resolve('dist/assets'), { recursive: true })
for (const asset of ['logo.png', 'city-name.png']) {
  await cp(resolve('src/assets', asset), resolve('dist/assets', asset))
}
console.log('Copied standalone Map, Services, and Projects portals to dist')
