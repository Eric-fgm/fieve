# Fieve

Fieve to nowoczesny, modułowy system zarządzania treścią (CMS), zaprojektowany z myślą o łatwości użycia, elastyczności i skalowalności. Naszym celem jest dostarczenie narzędzia, które umożliwi szybkie tworzenie, zarządzanie i aktualizowanie stron internetowych, zarówno dla osób technicznych, jak i nietechnicznych.

## Kluczowe funkcje

- **Autorski ORM**: Ułatwia pracę z bazą danych.
- **Modularna architektura**: Łatwe rozszerzanie funkcjonalności za pomocą dodatkowych modułów i wtyczek.
- **Zarządzanie użytkownikami**: Obsługa ról i uprawnień dla zespołów, co ułatwia współpracę.
- **Bezpieczeństwo**: Nowoczesne mechanizmy zabezpieczeń, w tym ochrona przed XSS i CSRF oraz system kopii zapasowych.

## Technologie

- **Backend**: Bun / Node.js
- **Frontend**: React.js
- **Baza danych**: SQLite
- **API**: REST API

## Instalacja

Aby uruchomić Fieve lokalnie:

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/Eric-fgm/fieve.git
    ```
2. Przejdź do folderu examples:
    ```bash
   cd ./examples
    ```
3. Wybierz interesujący Cię przykład:
    ```bash
   cd ./base-cms
    ```
    ```bash
   cd ./blog-cms
    ```
4. Zainstaluj zależności:
    ```bash
   bun install
    ```
5. Uruchom lokalny serwer:
    ```bash
   bun dev
    ```

## Zastosowanie
Fieve może być wykorzystywany do tworzenia różnych rodzajów stron internetowych:

- **Strony firmowe**
- **Blogi**
- **Sklepy internetowe (integracja z platformami e-commerce)**
- **Serwisy informacyjne**

## Licencja
Fieve jest dostępny na licencji MIT.

## Adnotacja

This project was created using `bun init` in bun v1.1.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.