/**
 * @file: This is a file responsible for starting the server, and specifying how frequently it scans (in seconds)
 *
 */

import { server } from './server.js'

// This defines how frequently the server will scan for changes, in seconds
const SCAN_FREQUENCY_SECONDS = 12

server(SCAN_FREQUENCY_SECONDS)
