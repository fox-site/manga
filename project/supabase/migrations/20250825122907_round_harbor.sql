/*
  # Создание таблицы серий

  1. Новые таблицы
    - `episodes`
      - `id` (uuid, primary key) - ID серии
      - `manga_id` (uuid, foreign key) - Ссылка на мангу
      - `episode_number` (integer) - Номер серии
      - `title` (text) - Название серии
      - `video_url` (text) - Ссылка на видео
      - `duration` (integer) - Длительность в секундах
      - `is_available` (boolean) - Доступность
      - `created_at` (timestamp) - Дата создания

  2. Безопасность
    - Включить RLS для таблицы episodes
    - Публичное чтение доступных серий
    - Только админы могут изменять
*/

CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  title text DEFAULT '',
  video_url text,
  duration integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(manga_id, episode_number)
);

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Все могут читать доступные серии
CREATE POLICY "Anyone can read available episodes"
  ON episodes
  FOR SELECT
  TO public
  USING (is_available = true);

-- Только админы могут изменять
CREATE POLICY "Only admins can modify episodes"
  ON episodes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Триггер для обновления updated_at
CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();