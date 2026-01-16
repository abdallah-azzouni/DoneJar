import { userNotes } from '$lib/stores/userData';
import { get } from 'svelte/store';
import { nanoid } from 'nanoid'

export const dataActions = {
    createProject: (name:String, color:String) => {
        const newProject = {
            id:  nanoid(),
            name,
            color,
            columns: { todo: [], doing: [], jar: [] }
        };
        userNotes.update(state => ({
      ...state,
      projects: [...state.projects, newProject],
      activeProjectId: newProject.id
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
};

export const uiActions ={
    createProject:() => {

    }
}