import { userNotes } from '$lib/stores/userData';
import { get } from 'svelte/store';
import { nanoid } from 'nanoid'

export const dataActions = {
    createProject: (name:String, color:String) => {
        const newProject = {
            id:  nanoid(),
            name,
            color,
            columns: { todo: [], doing: [], done: [] }
        };
        userNotes.update(state => ({
      ...state,
      projects: [...state.projects, newProject],
      activeProjectId: newProject.id
    }));
  },

  setActiveProject: (projectId: string) => {
    userNotes.update(state => ({
      ...state,
      activeProjectId: projectId
    }));
  },
    

    // deleteProject: (projectId:any) => {
    //     userNotes.update(state => {
    //         state.projects = state.projects.filter(p => p.id !== projectId);
    //         if (state.activeProjectId === projectId) {
    //             state.activeProjectId = state.projects[0]?.id || null;
    //         }
    //         return state;
    //     });
    // }

    createNote: (projectId:string, title:string, color:string) => {
        const newNote = {
            id:  nanoid(),
            title,
            color,
            projectId
        };
        console.log(newNote);
        userNotes.update(state => ({
      ...state,
      projects: state.projects.map(p => p.id === projectId ? {...p, columns: {...p.columns, todo: [...p.columns.todo, newNote]}} : p)
    }));
  }
};

export const uiActions ={
    createProject:() => {

    }
}