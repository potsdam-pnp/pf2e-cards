#!/bin/sh

cards="Crossbow Heal Demoralize Detect"

pdftk cards.pdf dump_data_utf8 | grep ^Bookmark > bookmarks.txt

for card in $cards; do
  page=$(cat bookmarks.txt | sed -n "/^BookmarkTitle: $card/,+2s/BookmarkPageNumber: //p" | head -n 1)
  pdftoppm -f $page -l $page -png cards.pdf > "$card.png"
done
