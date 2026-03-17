-- Chat History: conversations and messages for the AI assistant

CREATE TABLE condocompare.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES condocompare.users(id),
    titulo VARCHAR(200),
    context_type VARCHAR(50) DEFAULT 'geral',
    condominio_id UUID REFERENCES condocompare.condominios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE condocompare.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES condocompare.chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_conversations_user ON condocompare.chat_conversations(user_id, active);
CREATE INDEX idx_chat_conversations_updated ON condocompare.chat_conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation ON condocompare.chat_messages(conversation_id, created_at);
