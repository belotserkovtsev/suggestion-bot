import { Markup } from 'telegraf'

export class ReactorService {

    constructor(sceneService) {
        this.sceneService = sceneService

        this.start = this.start.bind(this)
        this.offer = this.offer.bind(this)
        this.contacts = this.contacts.bind(this)
    }

    start(ctx) {
        ctx.reply(`Добро пожаловать в предложку сры. Зачем ты тут?`, Markup
            .keyboard(this.sceneService.defaultKeyboard)
            .oneTime()
            .resize())
            .catch(() => {})
    }

    offer(ctx) {
        this.sceneService.enterOfferScene(ctx)
    }

    contacts(ctx) {
        ctx.reply(`Это он @belotserkovtsev`, Markup
            .keyboard(this.sceneService.defaultKeyboard)
            .oneTime()
            .resize())
            .catch(() => {})
    }

    quit(ctx) {
        ctx.leaveChat()
    }
}