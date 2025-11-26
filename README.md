## Первая задача "сортировка жидкостей"

Для запуска:
1. откройте командную строку
2. перейдите в корневую папку проекта java_javascript_projects
3. напишите gradlew.bat run

## Вторая задача "Сервис обмена файлами"

Для запуска:
1. откройте командную строку
2. перейдите в папку задачи java_javascript_projects/task2_file_sharing
3. напишите npm install дождитесь установки всех зависимостей
4. напишите npm start
5. откройте в браузере ссылку http://localhost:3000

## Третья задача "Сервис прогноза погоды по городам"

Для запуска:
1. откройте командную строку
2. перейдите в папку задачи java_javascript_projects/task3_weather_forecast
3. напишите npm install дождитесь установки всех зависимостей

далее 2 варианта

вариант 1 (рекомендуемый) без Docker и без Redis  
4. напишите npm start дождитесь запуска погодного сервиса  
5. в браузере откройте ссылку http://localhost:3000/weather?city=Berlin  
вместо Berlin можно указать любой другой город и увидеть график температуры на предстоящие сутки  

вариант 2 Docker + Redis  
4. установите и запустите Docker Desktop  
5. в ранее запущенной консоли напишите docker-compose up -d redis дождитесь запуска сервера redis  
6. далее npm run start:redis дождитесь запуска погодного сервиса  
7. в браузере откройте ссылку http://localhost:3000/weather?city=Berlin  
вместо Berlin можно указать любой другой город и увидеть график температуры на предстоящие сутки  
8. по завершии работы напишите docker-compose down  

Время на графике показано в UTC

Примеры прогноза для разных городов  
http://localhost:3000/weather?city=Izhevsk  
http://localhost:3000/weather?city=Moscow  
http://localhost:3000/weather?city=Freiburg  
http://localhost:3000/weather?city=Ushuaia  
http://localhost:3000/weather?city=Tokyo  
http://localhost:3000/weather?city=London
