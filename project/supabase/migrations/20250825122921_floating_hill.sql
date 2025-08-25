/*
  # Создание таблицы рейтингов

  1. Новые таблицы
    - `ratings`
      - `id` (uuid, primary key) - ID рейтинга
      - `user_id` (uuid, foreign key) - Кто оценил
      - `manga_id` (uuid, foreign key) - Что оценил
      - `rating` (integer) - Оценка от 1 до 10
      - `created_at` (timestamp) - Дата оценки

  2. Безопасность
    - Включить RLS для таблицы ratings
    - Пользователи могут создавать и обновлять свои оценки
    - Все могут читать рейтинги
*/

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Все могут читать рейтинги
CREATE POLICY "Anyone can read ratings"
  ON ratings
  FOR SELECT
  TO public
  USING (true);

-- Авторизованные пользователи могут создавать рейтинги
CREATE POLICY "Authenticated users can create ratings"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои рейтинги
CREATE POLICY "Users can update own ratings"
  ON ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического обновления рейтинга манги
CREATE OR REPLACE FUNCTION update_manga_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE manga 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM ratings 
      WHERE manga_id = COALESCE(NEW.manga_id, OLD.manga_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings 
      WHERE manga_id = COALESCE(NEW.manga_id, OLD.manga_id)
    )
  WHERE id = COALESCE(NEW.manga_id, OLD.manga_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления рейтинга
CREATE TRIGGER update_manga_rating_on_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_manga_rating();

CREATE TRIGGER update_manga_rating_on_update
  AFTER UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_manga_rating();

CREATE TRIGGER update_manga_rating_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_manga_rating();