from app.schemas.base import CamelModel


class QuickReply(CamelModel):
    id: str
    label: str


class ChatAction(CamelModel):
    type: str  # 'book'
    path: str
    label: str
    consultation_type: str | None = None


class ChatIntroOut(CamelModel):
    greeting: str
    quick_replies: list[QuickReply]


class ChatMessageIn(CamelModel):
    message: str | None = None
    choice_id: str | None = None


class ChatReplyOut(CamelModel):
    reply: str
    safety: bool = False
    quick_replies: list[QuickReply] = []
    actions: list[ChatAction] = []