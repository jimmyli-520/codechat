export type DeleteTarget = {
  id: string;
  title: string;
};

export type DeleteConfirmationState = {
  isDeleting: boolean;
  target: DeleteTarget | null;
};

export type DeleteConfirmationAction =
  | { type: "request"; target: DeleteTarget }
  | { type: "cancel" }
  | { type: "start" }
  | { type: "success" }
  | { type: "failure" };

export const initialDeleteConfirmationState: DeleteConfirmationState = {
  isDeleting: false,
  target: null
};

export function deleteConfirmationReducer(
  state: DeleteConfirmationState,
  action: DeleteConfirmationAction
): DeleteConfirmationState {
  switch (action.type) {
    case "request":
      return state.isDeleting
        ? state
        : {
            isDeleting: false,
            target: action.target
          };
    case "cancel":
      return state.isDeleting ? state : initialDeleteConfirmationState;
    case "start":
      return state.target && !state.isDeleting
        ? {
            ...state,
            isDeleting: true
          }
        : state;
    case "success":
      return initialDeleteConfirmationState;
    case "failure":
      return {
        ...state,
        isDeleting: false
      };
  }
}
