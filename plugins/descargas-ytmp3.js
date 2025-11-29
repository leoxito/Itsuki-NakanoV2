import { convertAndDownload } from '../lib/cnvDownloader.js'

const MAX_FILE_BYTES = 70 * 1024 * 1024
const AUDIO_COMMANDS = ['ytmp3', 'yta', 'ytaudio', 'yt2']
const VIDEO_COMMANDS = ['ytmp4', 'ytv', 'ytvideo']

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
	const rawInput = (text || '').trim()
	const lowerCommand = (command || '').toLowerCase()
	const isAudioCommand = AUDIO_COMMANDS.includes(lowerCommand)
	const isVideoCommand = VIDEO_COMMANDS.includes(lowerCommand)
	const mode = isVideoCommand ? 'video' : 'audio'
	const isAudio = mode === 'audio'

	let linkPart = rawInput
	let qualityPart = ''

	if (rawInput.includes('|')) {
		const parts = rawInput.split('|')
		linkPart = (parts[0] || '').trim()
		qualityPart = (parts[1] || '').trim()
	} else if (args.length > 1) {
		linkPart = args[0]
		qualityPart = args.slice(1).join(' ')
	}

	if (!linkPart) {
		return
	}

	const format = isAudio ? 'mp3' : 'mp4'
	let audioBitrate = '320'
	let videoQuality = '720'

	if (qualityPart) {
		if (isAudio) audioBitrate = qualityPart.toLowerCase()
		else videoQuality = qualityPart.toLowerCase()
	}

	await tryReact(m, '⏳')

	try {
		const result = await convertAndDownload(linkPart, {
			format,
			audioBitrate,
			videoQuality
		})

		if (result.size && result.size > MAX_FILE_BYTES) {
			await tryReact(m, '✖️')
			return
		}

		const fileName = result.fileName || result.filename || `yt.${isAudio ? 'mp3' : 'mp4'}`
		const payload = buildPayload(isAudio, result.buffer, result.mime, fileName)

		let delivered = false
		try {
			await conn.sendMessage(m.chat, payload, { quoted: m })
			delivered = true
		} catch (primaryErr) {
			console.error('[ytmp3] envío principal falló:', primaryErr)
			try {
				await conn.sendMessage(
					m.chat,
					{
						document: result.buffer,
						mimetype: result.mime || (isAudio ? 'audio/mpeg' : 'video/mp4'),
						fileName
					},
					{ quoted: m }
				)
				delivered = true
			} catch (fallbackErr) {
				console.error('[ytmp3] envío documento falló:', fallbackErr)
			}
		}

		if (!delivered) {
			await tryReact(m, '✖️')
			return
		}

		await tryReact(m, '✅')
	} catch (error) {
		console.error('[ytmp3] error:', error)
		await tryReact(m, '✖️')
	}
}

function buildPayload(isAudio, buffer, mime, fileName) {
	const fallbackMime = isAudio ? 'audio/mpeg' : 'video/mp4'
	const sanitizedMime = (!mime || mime === 'application/octet-stream') ? fallbackMime : mime
	if (isAudio) {
		return {
			audio: buffer,
			mimetype: sanitizedMime,
			fileName,
			ptt: false
		}
	}
	return {
		video: buffer,
		mimetype: sanitizedMime,
		fileName
	}
}

async function tryReact(m, emoji) {
	if (typeof m?.react !== 'function') return
	try {
		await m.react(emoji)
	} catch {}
}


handler.tags = ['downloader']
handler.command = /^(ytmp3|ytmp4)$/i

export default handler