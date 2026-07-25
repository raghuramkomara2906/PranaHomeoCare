from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for every response/request schema — serializes snake_case Python
    fields as camelCase JSON so they match the frontend's TS types in
    src/lib/types/* exactly, with no transformation needed on the frontend."""

    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )
