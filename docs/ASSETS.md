# Фотографии, шрифты и графика

Материалы отобраны 29.09.2026 из профиля Веры по разрешению Антона в задаче. На странице используются локальные JPEG без внешнего запроса к Instagram. Ссылки на первоисточники сохранены в подписях и здесь.

| Файл | Источник | Содержание и обработка |
| --- | --- | --- |
| `site/assets/vera-portrait.jpg` | [Публикация DbLxLAtjErr](https://www.instagram.com/vera_dudenkova/p/DbLxLAtjErr/) | Первая фотография из карусели о пробежке; 1080×1440. Это спортивный портрет, не документальный кадр теннисной тренировки. Повторное JPEG-сжатие; кадрирование только через CSS, без ретуши |
| `site/assets/tennis-equipment.jpg` | [Публикация DakZAr7stdS](https://www.instagram.com/vera_dudenkova/reel/DakZAr7stdS/) | Обложка ролика: ракетка и корзина мячей; 360×640. Применяется в небольшом размере. Нужен оригинал для более крупного использования |
| `.local/sources/group-training-announcement.jpg` (не в Git) | [Актуальное «тренировки!»](https://www.instagram.com/stories/highlights/18037531151792171/) | Объявление о планах групповых тренировок; источник для редактора, на сайт не выведено |

Оригиналы скачанных файлов сохранены в игнорируемом `.local/sources/`. Их не включает ни коммит, ни сборка сайта. Подписанные CDN-адреса не являются долговечными источниками, поэтому в документации используются адреса публикаций.

Визуальные изменения изображения: сжатие и кадрирование в вёрстке. Лица, тело, окружение, цвета и текст исходников не изменялись генерацией. Фотографии из Instagram — материал для первой версии; для финальной желательно получить оригиналы выбранных кадров и подтвердить выбор с Верой.

## Шрифты

Подключены локально 29.09.2026. Все три WOFF2 взяты без модификации из репозиториев авторов, с кириллицей. `font-display: swap`, системные fallback; внешних запросов к шрифтовым сервисам нет. Копии SIL Open Font License 1.1 лежат рядом с файлами.

| Файл | Источник | Роль |
| --- | --- | --- |
| `site/assets/fonts/commissioner-regular.woff2` | [Commissioner Regular](https://github.com/kosbarts/Commissioner/blob/master/fonts/webfonts/Commissioner-Regular.woff2) | Основной текст, подписи, заголовки второго уровня |
| `site/assets/fonts/commissioner-medium.woff2` | [Commissioner Medium](https://github.com/kosbarts/Commissioner/blob/master/fonts/webfonts/Commissioner-Medium.woff2) | Имя, кнопки и короткие метки |
| `site/assets/fonts/bona-nova-italic.woff2` | [Bona Nova Italic](https://github.com/kosmynkab/Bona-Nova/blob/main/fonts/webfonts/BonaNova-Italic.woff2) | Логотип `vera.`, «Увидимся на корте», личная фраза про Уимблдон, акцент контактного заголовка |

Шрифтовые файлы — 285 840 байт суммарно. [TypeDump](https://typedump.com/) использован для выбора; источники файлов — репозитории авторов.

## Графика Rise

`site/assets/grass-arcs.svg` — статичный экспорт из [Playgrnd Rise](https://www.playgrnd.tools/rise), созданный 29.09.2026 для сайта Веры. Вариант `12124`, anchor `Bottom`, stripes `22`, weight `58%`, bands `3`, depth `22%`, пропорции `16:9`, размер `2400 × 1350`. Цвета: field `#f4f3eb`, bars `#24563f`, accent `#766089`. Animate, dither и grain выключены.

Файл сохранён без модификации, 10 123 байта. Используется как декоративный CSS-фон в скрытом от скринридера элементе. Это абстрактная графика полос и дуг; она не является фотографией корта или официальной графикой Wimbledon. На сайте нет зависимости от Playgrnd.
