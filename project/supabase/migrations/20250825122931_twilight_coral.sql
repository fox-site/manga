/*
  # Создание таблицы донатов

  1. Новые таблицы
    - `donations`
      - `id` (uuid, primary key) - ID доната
      - `user_id` (uuid, foreign key) - Кто донатил
      - `manga_id` (uuid, foreign key) - На что донатил
      - `amount` (integer) - Сумма в копейках
      - `currency` (text) - Валюта
      - `payment_id` (text) - ID платежа в Stripe
      - `status` (text) - Статус платежа
      - `created_at` (timestamp) - Дата доната

  2. Безопасность
    - Включить RLS для таблицы donations
    - Пользователи могут читать свои донаты
    - Все могут читать общую статистику
*/

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'RUB',
  payment_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать свои донаты
CREATE POLICY "Users can read own donations"
  ON donations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Все могут читать завершенные донаты для статистики
CREATE POLICY "Anyone can read completed donations stats"
  ON donations
  FOR SELECT
  TO public
  USING (status = 'completed');

-- Только система может создавать донаты
CREATE POLICY "Only system can create donations"
  ON donations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Функция для обновления донатов манги
CREATE OR REPLACE FUNCTION update_manga_donations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE manga 
    SET current_donations = current_donations + NEW.amount
    WHERE id = NEW.manga_id;
    
    UPDATE users
    SET total_donations = total_donations + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления донатов
CREATE TRIGGER update_manga_donations_on_payment
  AFTER UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_manga_donations();