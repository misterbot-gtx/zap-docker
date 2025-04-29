"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = exports.verifyQuotedMessage = exports.verifyMessageMedia = exports.verifyMessageFace = void 0;
const fs_1 = require("fs");
const fs_2 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const path_1 = require("path");
const CreateOrUpdateContactService_1 = __importDefault(require("../ContactServices/CreateOrUpdateContactService"));
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const FindOrCreateTicketService_1 = __importDefault(require("../TicketServices/FindOrCreateTicketService"));
const graphAPI_1 = require("./graphAPI");
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Chatbot_1 = __importDefault(require("../../models/Chatbot"));
const Message_1 = __importDefault(require("../../models/Message"));
const ChatbotListenerFacebook_1 = require("../WbotServices/ChatbotListenerFacebook");
const lodash_1 = require("lodash");
const FindOrCreateATicketTrakingService_1 = __importDefault(require("../TicketServices/FindOrCreateATicketTrakingService"));
const wbotMessageListener_1 = require("../WbotServices/wbotMessageListener");
const CompaniesSettings_1 = __importDefault(require("../../models/CompaniesSettings"));
const sendFacebookMessage_1 = __importDefault(require("./sendFacebookMessage"));
const async_mutex_1 = require("async-mutex");
const TicketTag_1 = __importDefault(require("../../models/TicketTag"));
const Tag_1 = __importDefault(require("../../models/Tag"));
const verifyContact = async (msgContact, token, companyId) => {
    if (!msgContact)
        return null;
    const contactData = {
        name: msgContact?.name || `${msgContact?.first_name} ${msgContact?.last_name}`,
        number: msgContact.id,
        profilePicUrl: msgContact.profile_pic,
        isGroup: false,
        companyId: companyId,
        channel: token.channel,
        whatsappId: token.id
    };
    const contact = (0, CreateOrUpdateContactService_1.default)(contactData);
    return contact;
};
const verifyMessageFace = async (msg, body, ticket, contact, fromMe = false) => {
    const quotedMsg = await (0, exports.verifyQuotedMessage)(msg);
    const messageData = {
        wid: msg.mid || msg.message_id,
        ticketId: ticket.id,
        contactId: fromMe ? undefined : msg.is_echo ? undefined : contact.id,
        body: msg.text || body,
        fromMe: fromMe ? fromMe : msg.is_echo ? true : false,
        read: fromMe ? fromMe : msg.is_echo,
        quotedMsgId: quotedMsg?.id,
        ack: 3,
        dataJson: JSON.stringify(msg),
        channel: ticket.channel
    };
    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
    // await ticket.update({
    //   lastMessage: msg.text
    // });
};
exports.verifyMessageFace = verifyMessageFace;
const verifyMessageMedia = async (msg, ticket, contact, fromMe = false) => {
    const { data } = await axios_1.default.get(msg.attachments[0].payload.url, {
        responseType: "arraybuffer"
    });
    // eslint-disable-next-line no-eval
    const { fileTypeFromBuffer } = await eval('import("file-type")');
    const type = await fileTypeFromBuffer(data);
    const fileName = `${new Date().getTime()}.${type.ext}`;
    const folder = `public/company${ticket.companyId}`;
    if (!fs_2.default.existsSync(folder)) {
        fs_2.default.mkdirSync(folder);
        fs_2.default.chmodSync(folder, 0o777);
    }
    (0, fs_1.writeFileSync)((0, path_1.join)(__dirname, "..", "..", "..", folder, fileName), data, "base64");
    const messageData = {
        wid: msg.mid,
        ticketId: ticket.id,
        contactId: fromMe ? undefined : msg.is_echo ? undefined : contact.id,
        body: msg.text || fileName,
        fromMe: fromMe ? fromMe : msg.is_echo ? true : false,
        mediaType: msg.attachments[0].type,
        mediaUrl: fileName,
        read: fromMe ? fromMe : msg.is_echo,
        quotedMsgId: null,
        ack: 3,
        dataJson: JSON.stringify(msg),
        channel: ticket.channel
    };
    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
    // await ticket.update({
    //   lastMessage: msg.text
    // });
};
exports.verifyMessageMedia = verifyMessageMedia;
const verifyQuotedMessage = async (msg) => {
    if (!msg)
        return null;
    const quoted = msg?.reply_to?.mid;
    if (!quoted)
        return null;
    const quotedMsg = await Message_1.default.findOne({
        where: { wid: quoted }
    });
    if (!quotedMsg)
        return null;
    return quotedMsg;
};
exports.verifyQuotedMessage = verifyQuotedMessage;
const handleMessage = async (token, webhookEvent, channel, companyId) => {
    try {
        if (webhookEvent.message) {
            let msgContact;
            const senderPsid = webhookEvent.sender.id;
            const recipientPsid = webhookEvent.recipient.id;
            const { message } = webhookEvent;
            const fromMe = message.is_echo;
            let bodyMessage = message.text;
            if (fromMe) {
                if (/\u200e/.test(bodyMessage))
                    return;
                msgContact = await (0, graphAPI_1.profilePsid)(recipientPsid, token.facebookUserToken);
            }
            else {
                msgContact = await (0, graphAPI_1.profilePsid)(senderPsid, token.facebookUserToken);
            }
            const contact = await verifyContact(msgContact, token, companyId);
            const unreadCount = fromMe ? 0 : 1;
            const getSession = await Whatsapp_1.default.findOne({
                where: {
                    facebookPageUserId: token.facebookPageUserId
                },
                include: [
                    {
                        model: Queue_1.default,
                        as: "queues",
                        attributes: ["id", "name", "color", "greetingMessage"],
                        include: [
                            {
                                model: Chatbot_1.default,
                                as: "chatbots",
                                attributes: ["id", "name", "greetingMessage"]
                            }
                        ]
                    }
                ],
                order: [
                    ["queues", "id", "ASC"],
                    ["queues", "chatbots", "id", "ASC"]
                ]
            });
            const settings = await CompaniesSettings_1.default.findOne({
                where: { companyId }
            });
            const mutex = new async_mutex_1.Mutex();
            const ticket = await mutex.runExclusive(async () => {
                const createTicket = await (0, FindOrCreateTicketService_1.default)(contact, getSession, unreadCount, companyId, 0, 0, null, channel, null, false, settings);
                return createTicket;
            });
            let bodyRollbackTag = "";
            let bodyNextTag = "";
            let rollbackTag;
            let nextTag;
            let ticketTag = undefined;
            // console.log(ticket.id)
            if (ticket?.company?.plan?.useKanban) {
                ticketTag = await TicketTag_1.default.findOne({
                    where: {
                        ticketId: ticket.id
                    }
                });
                if (ticketTag) {
                    const tag = await Tag_1.default.findByPk(ticketTag.tagId);
                    if (tag.nextLaneId) {
                        nextTag = await Tag_1.default.findByPk(tag.nextLaneId);
                        bodyNextTag = nextTag.greetingMessageLane;
                    }
                    if (tag.rollbackLaneId) {
                        rollbackTag = await Tag_1.default.findByPk(tag.rollbackLaneId);
                        bodyRollbackTag = rollbackTag.greetingMessageLane;
                    }
                }
            }
            const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
                ticketId: ticket.id,
                companyId,
                whatsappId: getSession?.id,
                userId: ticket.userId
            });
            if ((getSession.farewellMessage &&
                (0, Mustache_1.default)(getSession.farewellMessage, ticket) === message.text) ||
                (getSession.ratingMessage &&
                    (0, Mustache_1.default)(getSession.ratingMessage, ticket) === message.text))
                return;
            if (rollbackTag && (0, Mustache_1.default)(bodyNextTag, ticket) !== bodyMessage && (0, Mustache_1.default)(bodyRollbackTag, ticket) !== bodyMessage) {
                await TicketTag_1.default.destroy({ where: { ticketId: ticket.id, tagId: ticketTag.tagId } });
                await TicketTag_1.default.create({ ticketId: ticket.id, tagId: rollbackTag.id });
            }
            await ticket.update({
                lastMessage: message.text
            });
            try {
                if (!fromMe) {
                    /**
                     * Tratamento para avaliação do atendente
                     */
                    if (ticket.status === "nps" && ticketTraking !== null && (0, wbotMessageListener_1.verifyRating)(ticketTraking)) {
                        if (!isNaN(parseFloat(bodyMessage))) {
                            (0, wbotMessageListener_1.handleRating)(parseFloat(bodyMessage), ticket, ticketTraking);
                            await ticketTraking.update({
                                ratingAt: (0, moment_1.default)().toDate(),
                                finishedAt: (0, moment_1.default)().toDate(),
                                rated: true
                            });
                            return;
                        }
                        else {
                            if (ticket.amountUsedBotQueuesNPS < getSession.maxUseBotQueuesNPS) {
                                let bodyErrorRating = `\u200eOpção inválida, tente novamente.\n`;
                                const sentMessage = await (0, graphAPI_1.sendText)(contact.number, bodyErrorRating, getSession.facebookUserToken);
                                await (0, exports.verifyMessageFace)(sentMessage, bodyErrorRating, ticket, contact);
                                // await delay(1000);
                                let bodyRatingMessage = `\u200e${getSession.ratingMessage}\n`;
                                const msg = await (0, graphAPI_1.sendText)(contact.number, bodyRatingMessage, getSession.facebookUserToken);
                                await (0, exports.verifyMessageFace)(sentMessage, bodyRatingMessage, ticket, contact);
                                await ticket.update({
                                    amountUsedBotQueuesNPS: ticket.amountUsedBotQueuesNPS + 1
                                });
                            }
                            return;
                        }
                    }
                    const enableLGPD = settings.enableLGPD === "enabled";
                    //TRATAMENTO LGPD
                    if (enableLGPD && ticket.status === "lgpd") {
                        if ((0, lodash_1.isNil)(ticket.lgpdAcceptedAt) && !(0, lodash_1.isNil)(ticket.lgpdSendMessageAt)) {
                            let choosenOption = null;
                            if (!isNaN(parseFloat(bodyMessage))) {
                                choosenOption = parseFloat(bodyMessage);
                            }
                            //Se digitou opção numérica
                            if (!Number.isNaN(choosenOption) && Number.isInteger(choosenOption) && !(0, lodash_1.isNull)(choosenOption) && choosenOption > 0) {
                                //Se digitou 1, aceitou o termo e vai pro bot
                                if (choosenOption === 1) {
                                    await contact.update({
                                        lgpdAcceptedAt: (0, moment_1.default)().toDate(),
                                    });
                                    await ticket.update({
                                        lgpdAcceptedAt: (0, moment_1.default)().toDate(),
                                        amountUsedBotQueues: 0
                                    });
                                    //Se digitou 2, recusou o bot e encerra chamado
                                }
                                else if (choosenOption === 2) {
                                    if (getSession.complationMessage !== "" && getSession.complationMessage !== undefined) {
                                        const sentMessage = await (0, graphAPI_1.sendText)(contact.number, `\u200e${getSession.complationMessage}`, getSession.facebookUserToken);
                                        await (0, exports.verifyMessageFace)(sentMessage, `\u200e${getSession.complationMessage}`, ticket, contact);
                                    }
                                    await ticket.update({
                                        status: "closed",
                                        amountUsedBotQueues: 0
                                    });
                                    await ticketTraking.destroy;
                                    return;
                                    //se digitou qualquer opção que não seja 1 ou 2 limpa o lgpdSendMessageAt para 
                                    //enviar de novo o bot respeitando o numero máximo de vezes que o bot é pra ser enviado
                                }
                                else {
                                    if (ticket.amountUsedBotQueues < getSession.maxUseBotQueues) {
                                        await ticket.update({
                                            amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
                                            lgpdSendMessageAt: null
                                        });
                                    }
                                }
                                //se digitou qualquer opção que não número o lgpdSendMessageAt para 
                                //enviar de novo o bot respeitando o numero máximo de vezes que o bot é pra ser enviado
                            }
                            else {
                                if (ticket.amountUsedBotQueues < getSession.maxUseBotQueues) {
                                    await ticket.update({
                                        amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
                                        lgpdSendMessageAt: null
                                    });
                                }
                            }
                        }
                        if ((contact.lgpdAcceptedAt === null || settings?.lgpdConsent === "enabled") &&
                            !contact.isGroup && (0, lodash_1.isNil)(ticket.lgpdSendMessageAt) &&
                            ticket.amountUsedBotQueues <= getSession.maxUseBotQueues && !(0, lodash_1.isNil)(settings?.lgpdMessage)) {
                            if (message.attachments) {
                                await (0, exports.verifyMessageMedia)(message, ticket, contact);
                            }
                            else {
                                await (0, exports.verifyMessageFace)(message, message.text, ticket, contact);
                            }
                            if (!(0, lodash_1.isNil)(settings?.lgpdMessage) && settings.lgpdMessage !== "") {
                                const bodyMessageLGPD = (0, Mustache_1.default)(`\u200e${settings.lgpdMessage}`, ticket);
                                const sentMessage = await (0, graphAPI_1.sendText)(contact.number, bodyMessageLGPD, getSession.facebookUserToken);
                                await (0, exports.verifyMessageFace)(sentMessage, bodyMessageLGPD, ticket, contact);
                            }
                            // await delay(1000);
                            if (!(0, lodash_1.isNil)(settings?.lgpdLink) && settings?.lgpdLink !== "") {
                                const bodyLink = (0, Mustache_1.default)(`\u200e${settings.lgpdLink}`, ticket);
                                const sentMessage = await (0, graphAPI_1.sendText)(contact.number, bodyLink, getSession.facebookUserToken);
                                await (0, exports.verifyMessageFace)(sentMessage, bodyLink, ticket, contact);
                            }
                            ;
                            // await delay(1000);
                            const bodyBot = (0, Mustache_1.default)(`\u200eEstou ciente sobre o tratamento dos meus dados pessoais. \n\n*[1]* Sim\n*[2]* Não`, ticket);
                            const sentMessageBot = await (0, graphAPI_1.sendText)(contact.number, bodyBot, getSession.facebookUserToken);
                            await (0, exports.verifyMessageFace)(sentMessageBot, bodyBot, ticket, contact);
                            await ticket.update({
                                lgpdSendMessageAt: (0, moment_1.default)().toDate(),
                                amountUsedBotQueues: ticket.amountUsedBotQueues + 1
                            });
                            await ticket.reload();
                            return;
                        }
                        ;
                        if (!(0, lodash_1.isNil)(ticket.lgpdSendMessageAt) && (0, lodash_1.isNil)(ticket.lgpdAcceptedAt))
                            return;
                    }
                }
            }
            catch (e) {
                throw new Error(e);
                console.log(e);
            }
            if (message.attachments) {
                await (0, exports.verifyMessageMedia)(message, ticket, contact);
            }
            else {
                await (0, exports.verifyMessageFace)(message, message.text, ticket, contact);
            }
            if (!ticket.queue &&
                !fromMe &&
                !ticket.userId &&
                getSession.queues.length >= 1) {
                await verifyQueue(getSession, message, ticket, contact);
            }
            if (ticket.queue && ticket.queueId) {
                if (!ticket.user) {
                    await (0, ChatbotListenerFacebook_1.sayChatbot)(ticket.queueId, getSession, ticket, contact, message);
                }
            }
        }
        return;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.handleMessage = handleMessage;
const verifyQueue = async (getSession, msg, ticket, contact) => {
    // console.log("VERIFYING QUEUE", ticket.whatsappId, getSession.id)
    const { queues, greetingMessage } = await (0, ShowWhatsAppService_1.default)(getSession.id, ticket.companyId);
    if (queues.length === 1) {
        const firstQueue = (0, lodash_1.head)(queues);
        let chatbot = false;
        if (firstQueue?.chatbots) {
            chatbot = firstQueue?.chatbots?.length > 0;
        }
        await (0, UpdateTicketService_1.default)({
            ticketData: { queueId: queues[0].id, isBot: chatbot },
            ticketId: ticket.id,
            companyId: ticket.companyId
        });
        return;
    }
    let selectedOption = "";
    if (ticket.status !== "lgpd") {
        selectedOption = msg.text;
    }
    else {
        if (!(0, lodash_1.isNil)(ticket.lgpdAcceptedAt))
            await ticket.update({
                status: "pending"
            });
        await ticket.reload();
    }
    const choosenQueue = queues[+selectedOption - 1];
    if (choosenQueue) {
        await (0, UpdateTicketService_1.default)({
            ticketData: { queueId: choosenQueue.id },
            ticketId: ticket.id,
            companyId: ticket.companyId
        });
        if (choosenQueue.chatbots.length > 0) {
            let options = "";
            choosenQueue.chatbots.forEach((chatbot, index) => {
                options += `[${index + 1}] - ${chatbot.name}\n`;
            });
            const body = `${choosenQueue.greetingMessage}\n\n${options}\n[#] Voltar para o menu principal`;
            const sentMessage = await (0, sendFacebookMessage_1.default)({
                ticket,
                body: body
            });
            // const debouncedSentChatbot = debounce(
            //   async () => {
            //     await sendText(
            //   contact.number,
            //   formatBody(body, ticket),
            //   ticket.whatsapp.facebookUserToken
            // );
            //   },
            //   3000,
            //   ticket.id
            // );
            // debouncedSentChatbot();
            // return await verifyMessage(msg, body, ticket, contact);
        }
        if (!choosenQueue.chatbots.length) {
            const body = `${choosenQueue.greetingMessage}`;
            const sentMessage = await (0, sendFacebookMessage_1.default)({
                ticket,
                body: body
            });
            // const debouncedSentChatbot = debounce(
            //   async () => { await sendText(
            //   contact.number,
            //   formatBody(body, ticket),
            //   ticket.whatsapp.facebookUserToken
            // );
            //   },
            //   3000,
            //   ticket.id
            // );
            // debouncedSentChatbot();
            // return await verifyMessage(msg, body, ticket, contact);
        }
    }
    else {
        let options = "";
        queues.forEach((queue, index) => {
            options += `[${index + 1}] - ${queue.name}\n`;
        });
        const body = `${greetingMessage}\n\n${options}`;
        const sentMessage = await (0, sendFacebookMessage_1.default)({
            ticket,
            body: body
        });
        // const debouncedSentChatbot = debounce(
        //   async () => { await 
        //     sendText(
        //       contact.number,
        //       formatBody(body, ticket),
        //       ticket.whatsapp.facebookUserToken
        //     );
        //   },
        //   3000,
        //   ticket.id
        // );
        // debouncedSentChatbot();
        // return verifyMessage(msg, body, ticket, contact);
    }
};
