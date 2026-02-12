const { useEffect } = require("react");

const TestsPage = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTests = async () => {
            try {
                const data = await getTests();
                setTests(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        loadTests();
    }, []);

    if (loading) return <div>Loading Tests...</div>;
    if (error) return <div>Error: {error}</div>;

    return (<div>

    </div>
    );
};

export default TestsPage;