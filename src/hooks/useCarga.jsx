import { useEffect, useState } from "react";

function useAppLoading(delay) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    return loading;
}

export default useAppLoading