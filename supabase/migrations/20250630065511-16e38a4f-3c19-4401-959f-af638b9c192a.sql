
-- Mevcut type check constraint'ini kaldıralım
ALTER TABLE exhibitions DROP CONSTRAINT IF EXISTS exhibitions_type_check;

-- Yeni, daha esnek bir check constraint ekleyelim
ALTER TABLE exhibitions ADD CONSTRAINT exhibitions_type_check 
CHECK (type IN ('trade_show', 'exhibition', 'conference', 'seminar'));

-- Status constraint'ini de güncelleyelim
ALTER TABLE exhibitions DROP CONSTRAINT IF EXISTS exhibitions_status_check;
ALTER TABLE exhibitions ADD CONSTRAINT exhibitions_status_check 
CHECK (status IN ('planned', 'active', 'completed', 'cancelled'));
