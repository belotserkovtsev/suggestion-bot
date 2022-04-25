import {session, Scenes, Telegraf, Markup} from 'telegraf'
import { ReactorService } from "./Services/ReactorService.js"
import { SceneService } from "./Services/SceneService.js"

const bot = new Telegraf(process.env.token)

const sceneService = new SceneService(bot)
const reactorService = new ReactorService(sceneService)

const stage = new Scenes.Stage([sceneService.offerScene])
bot.use(session())
bot.use(stage.middleware())

bot.command('start', reactorService.start)
bot.command('quit', reactorService.quit)

bot.hears('😴 Расскажу про свои сры', reactorService.offer)
bot.hears('🤬 Админ еблан', reactorService.contacts)

bot.launch().catch(res => {
    console.log(res.error)
})
