package com.example.skillSwap.model;

import com.example.skillSwap.enums.SessionStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class SessionStatusConverter implements AttributeConverter<SessionStatus, String> {

    @Override
    public String convertToDatabaseColumn(SessionStatus status) {
        if (status == null) return null;
        return status.name();
    }

    @Override
    public SessionStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return SessionStatus.valueOf(dbData);
    }
}