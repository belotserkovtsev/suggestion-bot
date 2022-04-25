import {Markup, Scenes} from "telegraf"
import * as fs from "fs"
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'


export class SceneService {
    offerScene = new Scenes.BaseScene('offerScene')

    constructor(bot) {
        this.bot = bot
        this.defaultKeyboard = [
            ['😴 Расскажу про свои сры', '🤬 Админ еблан']
        ]
    }

    leaveCurrentScene(ctx, message) {
        if (message && ctx.scene) {
            ctx.reply(message).then(() => {
                return ctx.scene.leave()
            }).catch(() => {})
        } else if (ctx.scene){
            ctx.scene.leave().catch((e) => {})
        }
    }

    enterOfferScene(ctx) {
        ctx.reply(`Отправь мне скрин своего сра (по аналогии с постами в канале). Обязательно файлом и не больше 3 штук`).catch(() => {})

        this.offerScene.start((ctx) => {
            this.leaveCurrentScene(ctx)
        })

        this.offerScene.on("message", ctx => {
            const photo = ctx.update.message.photo
            const file = ctx.update.message.document

            if (ctx.session.uploadCount > 2) {
                if (this.dateDiffInDays(ctx.session.lastUploadTimestamp, Date.now()) < 1) {
                    if (!ctx.session.lastNotifiedAboutLimit) {
                        this.leaveCurrentScene(ctx, "Можно отправлять только 3 сра в день. Не надо спамить")
                        ctx.session.lastNotifiedAboutLimit = Date.now()
                    } else if (this.dateDiffInSeconds(ctx.session.lastNotifiedAboutLimit, Date.now()) < 5){
                        this.leaveCurrentScene(ctx)
                    } else {
                        this.leaveCurrentScene(ctx, "Можно отправлять только 3 сра в день. Не надо спамить")
                        ctx.session.lastNotifiedAboutLimit = Date.now()
                    }
                    return
                } else {
                    ctx.session.uploadCount = 0
                }
            }

            if (file) {
                this.handleFile(ctx)
            } else if (photo) {
                this.handlePhoto(ctx)
            } else {
                ctx.reply("Кажется это не картинка. Попробуй еще раз").catch(() => {})
                return
            }
        })

        ctx.scene.enter('offerScene')
            .catch(err => {
                console.log(err)
            })

        this.offerScene.leave(ctx => {
            if (!ctx.session.lastNotifiedAboutOfferLeave || this.dateDiffInSeconds(ctx.session.lastNotifiedAboutOfferLeave, Date.now()) > 5) {
                ctx.reply("Если еще есть чем поделиться - тыкай кнопки", Markup
                    .keyboard(this.defaultKeyboard)
                    .oneTime()
                    .resize())
                    .catch(() => {})
                ctx.session.lastNotifiedAboutOfferLeave = Date.now()
            }
        })
    }

    // MARK: Private

    handleFile(ctx) {
        const file = ctx.update.message.document
        const fileId = file.file_id

        this.handleDownloadAndUpload(ctx, fileId)
    }

    handlePhoto(ctx) {
        if (ctx.session.lastNotifiedAboutFile &&
            this.dateDiffInSeconds(ctx.session.lastNotifiedAboutFile, Date.now()) < 5) {
            return
        }

        ctx.session.lastNotifiedAboutFile = Date.now()
        ctx.reply("Пожалуйста, отправь картинку файлом. Иначе телеграм режет качество")
            .catch(() => {})
    }

    handleDownloadAndUpload(ctx, id) {
        ctx.session.lastUploadTimestamp = Date.now()
        ctx.session.uploadCount = ctx.session.uploadCount ? ctx.session.uploadCount + 1 : 1

        const path = `./Images/${ctx.message.from.id}_${uuidv4()}.jpg`
        const userMessage = `Отправил @${ctx.message.from.username}\nАйдишник ${ctx.message.from.id}`
        const anonUserMessage = `Отправил аноним\nАйдишник ${ctx.message.from.id}`

        ctx.telegram.getFileLink(id)
            .then(url => {
                const href = url.href
                this.leaveCurrentScene(ctx)
                return this.downloadImage(href, path)
            }).then(() => {
            return ctx.message.from.username ?
                this.bot.telegram.sendMessage(process.env.privateChannel, userMessage) :
                this.bot.telegram.sendMessage(process.env.privateChannel, anonUserMessage)
            }).then(() => {
                return this.bot.telegram.sendDocument(process.env.privateChannel, { source: path })
            }).catch(e => {
                this.leaveCurrentScene(ctx, "Погоди. Что-то пошло не так. Тыкни /start и попробуй еще раз")
                console.log(e)
            })
    }

    async downloadImage(url, filepath) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        })
        return new Promise((resolve, reject) => {
            response.data.pipe(fs.createWriteStream(filepath))
                .on('error', reject)
                .once('close', () => resolve(filepath));
        })
    }

    dateDiffInDays(first, second) {
        return Math.round((second-first)/(1000*60*60*24));
    }

    dateDiffInSeconds(first, second) {
        return Math.round((second-first)/(1000));
    }
}