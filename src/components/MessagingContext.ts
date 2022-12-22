import { createContext } from "react";
import { UserMessage } from "../AppReducer";

export const MessagingContext = createContext<(message: UserMessage) => void>(() => undefined);