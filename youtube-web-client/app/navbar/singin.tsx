"use client"

import { Fragment } from "react/jsx-runtime";
import styles from "./singin.module.css";
import { signInWithGoogle, signOut } from "../firebase/firebase";
import { User } from "firebase/auth";

interface SignInProps {
    user: User | null;
}

export default function SignIn({user}: SignInProps){
    return (
        <Fragment>
            {
        user ? <button className={styles.signin} onClick={signOut}>
                Sign Out
            </button> : <button className={styles.signin} onClick={signInWithGoogle}>
                Sign In
            </button>
    }
        </Fragment>
    )
};