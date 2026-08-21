from typing import Optional
from sqlalchemy import Select, or_, and_
from sqlalchemy.sql import Selectable


def apply_search(query: Select, search_fields: list[str], search_term: Optional[str]) -> Select:
    if not search_term:
        return query
    
    conditions = []
    for field in search_fields:
        conditions.append(field.ilike(f"%{search_term}%"))
    
    if conditions:
        query = query.where(or_(*conditions))
    
    return query


def apply_filters(query: Select, filters: dict) -> Select:
    for key, value in filters.items():
        if value is not None:
            query = query.where(getattr(query.column_descriptions[0]['entity'], key) == value)
    return query


def apply_sorting(query: Select, sort_by: Optional[str], sort_order: Optional[str] = "asc") -> Select:
    if not sort_by:
        return query
    
    model = query.column_descriptions[0]['entity']
    sort_column = getattr(model, sort_by, None)
    
    if sort_column is None:
        return query
    
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    return query
