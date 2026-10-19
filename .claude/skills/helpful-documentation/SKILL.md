---
name: helpful-documentation
description: Documenta o código, a arquitetura e os recursos do projeto com clareza, com explicações, exemplos e referências ao código-fonte, mantendo README.md e TLDR.md sincronizados com o código. Use sempre que criar, alterar ou visitar código, módulos, pastas ou arquivos de documentação neste projeto.
---

# Documentação útil

Documente o código de forma clara e concisa. Explique a arquitetura, as decisões
de design e o funcionamento, com exemplos e referências ao código-fonte relevante.
Mantenha a documentação sincronizada com o código.

Todo componente, módulo ou pacote que seja importado por mais de um outro módulo,
ou que exponha uma API pública, precisa de um README.md cobrindo seu propósito,
como usá-lo e os detalhes importantes.

Toda pasta que contenha arquivos de código-fonte, ou subpastas com arquivos de
código-fonte, precisa de um TLDR.md — menos completo que um README.md, uma visão
geral de alto nível do propósito e do conteúdo da pasta, que ajuda os
desenvolvedores a entender rapidamente sua estrutura e seus elementos principais.
Faça dele uma "cola": referências rápidas aos arquivos importantes, comandos e
padrões de uso. Destaque detalhes fáceis de passar despercebidos, mas importantes,
como dependências não óbvias, requisitos de configuração e padrões de uso
críticos. O TLDR.md não deve duplicar o README.md. Se os dois existirem na mesma
pasta, o TLDR.md deve remeter ao README.md para os detalhes completos e conter
apenas o conteúdo de referência rápida.

Sempre que visitar um README.md ou TLDR.md, verifique se ele está atualizado em
relação ao código. Se não estiver, atualize-o. Se estiver faltando, crie-o. Ao
atualizar, preserve o conteúdo existente que estiver correto e revise apenas as
seções que estiverem desatualizadas em relação ao código atual. Se um README.md ou
TLDR.md fizer referência a código, arquivos ou pastas que não existem mais, remova
essas referências. Se a pasta ou o módulo inteiro que o arquivo documentava tiver
sido apagado, apague também o arquivo de documentação.
