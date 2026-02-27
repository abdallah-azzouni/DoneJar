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
						"description": "Delta (Quill)",
						"color": "string (hex)",
						"dueDate": "number (timestamp) | null",
						"createdAt": "number (timestamp)",
						"updatedAt": "number (timestamp)"
					}
				],
				"doing": [{}],
				"done": [{}]
			}
		}
	]
}
```
