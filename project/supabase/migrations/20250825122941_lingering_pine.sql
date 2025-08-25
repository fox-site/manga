/*
  # Создание таблицы уведомлений

  1. Новые таблицы
    - `notifications`
      - `id` (uuid, primary key) - ID уведомления
      - `user_id` (uuid, foreign key) - Получатель
      - `manga_id` (uuid, foreign key) - Связанная манга
      - `type` (text) - Тип уведомления
      - `title` (text) - Заголовок
      - `message` (text) - Сообщение
      - `episode_number` (integer) - Номер серии
      - `is_read` (boolean) - Прочитано ли
      - `created_at` (timestamp) - Дата создания

  2. Безопасность
    - Включить RLS для таблицы notifications
    - Пользователи могут читать только свои уведомления
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id uuid REFERENCES manga(id) ON DELETE CASCADE,
  type text DEFAULT 'new_episode' CHECK (type IN ('new_episode', 'system', 'donation', 'subscription')),
  title text NOT NULL,
  message text NOT NULL,
  episode_number integer,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать только свои уведомления
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Пользователи могут обновлять статус прочтения своих уведомлений
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Система может создавать уведомления
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);