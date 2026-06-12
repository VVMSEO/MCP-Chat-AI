import { FunctionDeclaration, Type } from "@google/genai";

export const mcpTools: FunctionDeclaration[] = [
  {
    name: "list_articles",
    description: "Получить список статей пользователя.",
  },
  {
    name: "create_article",
    description: "Создать новую статью.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Заголовок статьи" },
        content: { type: Type.STRING, description: "Содержимое статьи" }
      },
      required: ["title"]
    }
  },
  {
    name: "get_article",
    description: "Получить статью по идентификатору вместе с содержимым.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING, description: "ID статьи" }
      },
      required: ["articleId"]
    }
  },
  {
    name: "get_article_blocks",
    description: "Получить блоки статьи с применёнными фильтрами.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING, description: "ID статьи" },
        search: { type: Type.STRING, description: "Строка для поиска по подстрокам (OR)" },
        types: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Типы блоков" },
        blocks_before: { type: Type.NUMBER, description: "Кол-во блоков до" },
        blocks_after: { type: Type.NUMBER, description: "Кол-во блоков после" }
      },
      required: ["articleId"]
    }
  },
  {
    name: "count_article_blocks",
    description: "Получить количество блоков статьи, удовлетворяющих фильтрам.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING, description: "ID статьи" },
        search: { type: Type.STRING },
        types: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["articleId"]
    }
  },
  {
    name: "delete_article",
    description: "Удалить статью по идентификатору.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING }
      },
      required: ["articleId"]
    }
  },
  {
    name: "set_article_content",
    description: "Полностью заменить содержимое статьи.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING },
        content: { type: Type.STRING }
      },
      required: ["articleId", "content"]
    }
  },
  {
    name: "modify_article_blocks",
    description: "Выполнить последовательные операции CRUD над блоками статьи.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING },
        operations: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: "Массив действий над блоками" }
      },
      required: ["articleId", "operations"]
    }
  },
  {
    name: "replace_article_text",
    description: "Найти и заменить текст в статье.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING },
        search: { type: Type.STRING },
        replace: { type: Type.STRING }
      },
      required: ["articleId", "search", "replace"]
    }
  },
  {
    name: "update_article_title",
    description: "Изменить заголовок статьи.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        articleId: { type: Type.STRING },
        newTitle: { type: Type.STRING }
      },
      required: ["articleId", "newTitle"]
    }
  },
  {
    name: "get_user_limits",
    description: "Получить лимиты пользователя.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limits_filter: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Обязательный фильтр по названиям лимитов" },
        projectId: { type: Type.STRING, description: "ID проекта (обязателен для competitorsAnalysis)" }
      },
      required: ["limits_filter"]
    }
  },
  {
    name: "get_user_project",
    description: "Получить проект пользователя по идентификатору.",
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING } },
      required: ["projectId"]
    }
  },
  {
    name: "get_user_project_by_domain",
    description: "Получить проект пользователя по домену.",
    parameters: {
      type: Type.OBJECT,
      properties: { domain: { type: Type.STRING } },
      required: ["domain"]
    }
  },
  {
    name: "get_user_projects",
    description: "Получить проекты пользователя.",
  },
  {
    name: "get_user_keywords_projects",
    description: "Получить список проектов пользователя с поисковыми параметрами проверки позиций ключевых слов.",
  },
  {
    name: "get_keywords",
    description: "Получить ключевые слова проекта, их группы и целевые URL.",
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING } },
      required: ["projectId"]
    }
  },
  {
    name: "create_keywords",
    description: "Массово добавить ключевые слова в проект.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["projectId", "keywords"]
    }
  },
  {
    name: "delete_keywords",
    description: "Удалить ключевые слова по идентификаторам.",
    parameters: {
      type: Type.OBJECT,
      properties: { keywordIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ["keywordIds"]
    }
  },
  {
    name: "update_keywords_status",
    description: "Изменить статус ключевых слов на hold или active.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        keywordIds: { type: Type.ARRAY, items: { type: Type.STRING } },
        status: { type: Type.STRING }
      },
      required: ["keywordIds", "status"]
    }
  },
  {
    name: "check_positions",
    description: "Запустить проверку позиций ключевых слов проекта.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING },
        search_options_id: { type: Type.STRING }
      },
      required: ["projectId"]
    }
  },
  {
    name: "get_keywords_summaries",
    description: "Получить сводку по ключам проекта для выбранного поискового параметра.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING },
        search_options_id: { type: Type.STRING }
      },
      required: ["projectId", "search_options_id"]
    }
  },
  {
    name: "get_keywords_positions_history",
    description: "Получить историю позиций ключевых слов по параметру поиска.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING },
        search_options_id: { type: Type.STRING }
      },
      required: ["projectId", "search_options_id"]
    }
  },
  {
    name: "get_project_keyword_groups",
    description: "Получить группы ключевых слов проекта.",
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING } },
      required: ["projectId"]
    }
  },
  {
    name: "create_keyword_group",
    description: "Создать группу ключевых слов проекта.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING },
        name: { type: Type.STRING }
      },
      required: ["projectId", "name"]
    }
  },
  {
    name: "delete_keyword_group",
    description: "Удалить группу ключевых слов по идентификатору.",
    parameters: {
      type: Type.OBJECT,
      properties: { groupId: { type: Type.STRING } },
      required: ["groupId"]
    }
  },
  {
    name: "update_group_keywords",
    description: "Обновить привязку ключевых слов к группе.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING },
        keywordIds: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["groupId", "keywordIds"]
    }
  },
  {
    name: "get_wordstat",
    description: "Получить частотность для одной или нескольких ключевых фраз за один вызов.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phrases: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["phrases"]
    }
  },
  {
    name: "get_region",
    description: "Получить идентификатор региона по названию и поисковой системе.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        searchEngine: { type: Type.STRING }
      },
      required: ["name", "searchEngine"]
    }
  },
  {
    name: "get_metrika_visits",
    description: "Получить данные о визитах из Яндекс.Метрики.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_metrika_goals",
    description: "Получить список целей из Яндекс.Метрики."
  },
  {
    name: "get_metrika_sources_summary",
    description: "Получить сводку по источникам трафика из Яндекс.Метрики.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_metrika_search_engines_data",
    description: "Получить количество сессий и пользователей с поисковых систем.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_metrika_page_depth_analysis",
    description: "Получить количество сессий с просмотром больше указанного кол-ва страниц.",
    parameters: {
      type: Type.OBJECT,
      properties: { depth: { type: Type.NUMBER }, startDate: { type: Type.STRING }, endDate: { type: Type.STRING } },
      required: ["depth"]
    }
  },
  {
    name: "get_metrika_goals_conversion",
    description: "Получить количество пользователей и коэффициенты конверсии для указанных целей.",
    parameters: {
      type: Type.OBJECT,
      properties: { goalIds: { type: Type.ARRAY, items: { type: Type.STRING } }, startDate: { type: Type.STRING }, endDate: { type: Type.STRING } },
      required: ["goalIds"]
    }
  },
  {
    name: "get_metrika_mobile_vs_desktop",
    description: "Сравнить метрики трафика между мобильными и десктопными пользователями.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_metrika_geographical_organic_traffic",
    description: "Проанализировать географическое распределение органического трафика из Яндекс.Метрики.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_metrika_data_by_time",
    description: "Получить данные за конкретный период времени, сгруппированные по времени.",
    parameters: {
      type: Type.OBJECT,
      properties: { grouping: { type: Type.STRING }, startDate: { type: Type.STRING }, endDate: { type: Type.STRING } },
      required: ["grouping"]
    }
  },
  {
    name: "get_metrika_conversion_rate_by_source_and_landing",
    description: "Получить анализ коэффициента конверсии по источнику трафика и целевой странице.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_metrika_pages_report",
    description: "Получить отчёт по страницам и метрикам из Яндекс.Метрики.",
    parameters: {
      type: Type.OBJECT,
      properties: { startDate: { type: Type.STRING }, endDate: { type: Type.STRING } }
    }
  },
  {
    name: "get_page_content",
    description: "Получить содержимое страницы по URL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING },
        format: { type: Type.STRING, description: "md, html, structure" }
      },
      required: ["url", "format"]
    }
  },
  {
    name: "get_page_screenshot",
    description: "Получить скриншот страницы по URL.",
    parameters: {
      type: Type.OBJECT,
      properties: { url: { type: Type.STRING } },
      required: ["url"]
    }
  },
  {
    name: "get_keywords_pages_summary",
    description: "Получить сводку по ключевым словам и страницам с расширенными фильтрами.",
  },
  {
    name: "get_pages_summary",
    description: "Получить сводку по страницам с расширенными фильтрами из GSC/Я.Вебмастер.",
  },
  {
    name: "get_pages_summary_by_dates",
    description: "Получить суммарные поисковые метрики с группировкой по датам.",
    parameters: {
      type: Type.OBJECT,
      properties: { grouping: { type: Type.STRING } },
      required: ["grouping"]
    }
  },
  {
    name: "get_serp",
    description: "Получить результаты поисковой системы по ключевой фразе.",
    parameters: {
      type: Type.OBJECT,
      properties: { keyword: { type: Type.STRING }, searchEngine: { type: Type.STRING } },
      required: ["keyword", "searchEngine"]
    }
  },
  {
    name: "get_position",
    description: "Получить позицию домена в поисковой системе по одной или нескольким ключевым фразам за один вызов.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        domain: { type: Type.STRING },
        phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
        searchEngine: { type: Type.STRING }
      },
      required: ["domain", "phrases", "searchEngine"]
    }
  },
  {
    name: "get_keywords_by_url",
    description: "Получить информацию о ключевых словах по url.",
    parameters: {
      type: Type.OBJECT,
      properties: { url: { type: Type.STRING } },
      required: ["url"]
    }
  },
  {
    name: "generate_image",
    description: "Сгенерировать изображениe по описанию с помощью ИИ.",
    parameters: {
      type: Type.OBJECT,
      properties: { description: { type: Type.STRING } },
      required: ["description"]
    }
  }
];
