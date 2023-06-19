---
title: "{{ replace .Name "-" " " | strings.FirstUpper }}"
date: {{ .Date }}
type: week
draft: true
---