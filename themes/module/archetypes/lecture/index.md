---
title: "{{ replace .Name "-" " " | strings.FirstUpper }}"
date: {{ .Date }}
type: lecture
order: 1
draft: true
---