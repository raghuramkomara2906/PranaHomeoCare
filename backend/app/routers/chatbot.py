from fastapi import APIRouter

from app.schemas.chatbot import ChatIntroOut, ChatMessageIn, ChatReplyOut
from app.services import chatbot

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.get("/intro", response_model=ChatIntroOut)
def intro() -> ChatIntroOut:
    return chatbot.intro()


@router.post("/message", response_model=ChatReplyOut)
def message(body: ChatMessageIn) -> ChatReplyOut:
    return chatbot.respond(message=body.message, choice_id=body.choice_id)