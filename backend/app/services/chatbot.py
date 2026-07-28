"""Rules-based consultation-guidance chatbot (Feature 10, V1).

Deliberately stateless and storage-free: it never persists the user's text
(FR-CHT-011) and never diagnoses, prescribes, doses, or promises outcomes
(FR-CHT-005/008). Anything that looks like a medical-advice request is met with
approved safety language and a nudge to book a consultation. Its whole job is to
help a patient pick teleconsultation vs video and hand off to booking — the main
booking flow never requires it (FR-CHT-001).
"""

from app.schemas.chatbot import ChatAction, ChatIntroOut, ChatReplyOut, QuickReply

BOOK_TELE = ChatAction(
    type="book", consultation_type="teleconsultation",
    path="/book?type=teleconsultation", label="Book Teleconsultation",
)
BOOK_VIDEO = ChatAction(
    type="book", consultation_type="video_consultation",
    path="/book?type=video_consultation", label="Book Video Consultation",
)

QUICK_REPLIES = [
    QuickReply(id="help_choose", label="Help me choose a consultation type"),
    QuickReply(id="how_booking", label="How does booking work?"),
    QuickReply(id="how_cancel", label="How do I cancel or reschedule?"),
    QuickReply(id="how_video", label="How does video consultation work?"),
    QuickReply(id="how_tele", label="How does teleconsultation work?"),
]

# Substrings that mark a request for medical advice — always deflect these.
_MEDICAL_TRIGGERS = (
    "diagnos", "prescri", "medicine", "medication", "dose", "dosage",
    "what should i take", "what do i take", "treat", "cure", "remedy",
    "symptom", "is it serious", "should i be worried", "side effect",
    "which medicine", "how much should i", "is this dangerous",
)


def intro() -> ChatIntroOut:
    return ChatIntroOut(
        greeting=(
            "Hi! I can help you choose between a teleconsultation and a video "
            "consultation, explain how booking works, or answer general questions. "
            "How can I help?"
        ),
        quick_replies=QUICK_REPLIES,
    )


def _is_medical(text: str) -> bool:
    return any(trigger in text for trigger in _MEDICAL_TRIGGERS)


def _recommendation(text: str) -> str | None:
    if any(k in text for k in ("no video", "without video", "no internet", "landline", "just call", "phone call")):
        return "teleconsultation"
    if any(k in text for k in ("see the doctor", "face to face", "in person", "video", "zoom")):
        return "video"
    return None


def _classify(text: str) -> str:
    if any(k in text for k in ("cancel", "reschedule", "change my appointment")):
        return "how_cancel"
    if any(k in text for k in ("choose", "which one", "which is", "better", "difference", "recommend", "suggest", "help me decide", "help me choose")):
        return "help_choose"
    if any(k in text for k in ("video", "zoom")):
        return "how_video"
    if any(k in text for k in ("tele", "phone", "call")):
        return "how_tele"
    if any(k in text for k in ("book", "appointment", "slot", "how does booking")):
        return "how_booking"
    return "unknown"


def _safety_reply() -> ChatReplyOut:
    return ChatReplyOut(
        reply=(
            "I'm not able to offer medical advice, a diagnosis, or medicine "
            "recommendations. For anything about your health, please book a "
            "consultation to speak with the practitioner directly."
        ),
        safety=True,
        quick_replies=QUICK_REPLIES,
        actions=[BOOK_TELE, BOOK_VIDEO],
    )


def _intent_reply(intent: str, recommend: str | None = None) -> ChatReplyOut:
    if intent == "help_choose":
        lead = ""
        if recommend == "teleconsultation":
            lead = "From what you've said, a teleconsultation may suit you best. "
        elif recommend == "video":
            lead = "From what you've said, a video consultation may suit you best. "
        return ChatReplyOut(
            reply=(
                f"{lead}Both consultations are free and last 30 minutes. A "
                "teleconsultation is a phone call — you call the clinic at your "
                "appointment time. A video consultation is over Zoom, using a link "
                "the practitioner adds before your appointment. If you'd rather not "
                "use video, choose teleconsultation; if you'd like to see the "
                "practitioner, choose video. This is only about the format, not a "
                "medical recommendation."
            ),
            quick_replies=QUICK_REPLIES,
            actions=[BOOK_TELE, BOOK_VIDEO],
        )
    if intent == "how_tele":
        return ChatReplyOut(
            reply=(
                "For a teleconsultation, book a free 30-minute slot and verify your "
                "mobile with a 6-digit OTP. You call the clinic at your appointment "
                "time — the number is shared after you book, and you'll get an SMS "
                "reminder three hours before."
            ),
            quick_replies=QUICK_REPLIES,
            actions=[BOOK_TELE],
        )
    if intent == "how_video":
        return ChatReplyOut(
            reply=(
                "For a video consultation, book a free 30-minute slot and verify your "
                "mobile with a 6-digit OTP. The practitioner adds a unique Zoom link "
                "before your appointment, and you'll get an SMS when it's ready. A "
                "Join button opens shortly before your time."
            ),
            quick_replies=QUICK_REPLIES,
            actions=[BOOK_VIDEO],
        )
    if intent == "how_booking":
        return ChatReplyOut(
            reply=(
                "Booking takes about a minute: pick teleconsultation or video, choose "
                "an available date and time, enter your name and Indian mobile number, "
                "and verify a 6-digit OTP. No account is needed, and you'll get an SMS "
                "confirmation."
            ),
            quick_replies=QUICK_REPLIES,
            actions=[BOOK_TELE, BOOK_VIDEO],
        )
    if intent == "how_cancel":
        return ChatReplyOut(
            reply=(
                "You can cancel or reschedule from your secure appointment link up to "
                "one hour before your appointment. After that, please contact the "
                "clinic."
            ),
            quick_replies=QUICK_REPLIES,
        )
    # unknown
    return ChatReplyOut(
        reply=(
            "I can help you choose a consultation type, explain how booking works, or "
            "how teleconsultation and video consultation work. I don't have approved "
            "information beyond that yet — what would you like to know?"
        ),
        quick_replies=QUICK_REPLIES,
    )


def respond(*, message: str | None = None, choice_id: str | None = None) -> ChatReplyOut:
    # A tapped quick-reply is a trusted, safe intent — use it directly.
    if choice_id:
        return _intent_reply(choice_id)

    text = (message or "").strip()
    if not text:
        return _intent_reply("unknown")

    low = text.lower()
    if _is_medical(low):
        return _safety_reply()

    return _intent_reply(_classify(low), _recommendation(low))