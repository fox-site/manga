/*
  # Создание таблицы пользовательских списков

  1. Новые таблицы
    - `user_lists`
      - `id` (uuid, primary key) - ID записи
      - `user_id` (uuid, foreign key) - Пользователь
      - `manga_id` (uuid, foreign key) - Манга
      - `list_type` (text) - Тип списка
      - `current_episode` (integer) - Текущая серия
      - `created_at` (timestamp) - Дата добавления

  2. Безопасность
    - Включить RLS для таблицы user_lists
    - Пользователи могут управлять только своими списками
*/

CREATE TABLE IF NOT EXISTS user_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  list_type text NOT NULL CHECK (list_type IN ('favorites', 'watching', 'want_to_watch', 'completed')),
  current_episode integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, manga_id, list_type)
);

ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;

-- Пользователи могут управлять только своими списками
CREATE POLICY "Users can manage own lists"
  ON user_lists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_user_lists_updated_at
  BEFORE UPDATE ON user_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();