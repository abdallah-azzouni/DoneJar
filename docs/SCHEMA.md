## DoneJar Data Schema

The application state is stored as a single JSON object. This structure supports multiple projects, persistent sticky note states, and the "Jar" (history).

```json
{
	"activeProjectId": "string",
	"projects": [
		{
			"id": "uuid",
			"name": "string",
			"icon": "string (emoji or svg path)",
			"columns": {
				"todo": [
					{
						"id": "uuid",
						"title": "string",
						"description": "string",
						"color": "string (tailwind class)",
						"createdAt": "Date",
						"finishDate": "Date"
					}
				],
				"doing": [{}],
				"jar": [{}]
			}
		}
	]
}
```
