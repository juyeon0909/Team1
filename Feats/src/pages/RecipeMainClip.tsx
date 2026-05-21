import { useNavigate } from "react-router-dom";


function App() {
    console.log('자바스크립트 코딩 영역');
    const Navigate = useNavigate();

    return (
        <>

            <button
            onClick={() => Navigate('/delete')}
            style={{ padding: '10px 14px', background: '#fff', color: '#555', border: '0.5px solid #ccc', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
            >
            스크랩 취소
            </button>
</>
    );
};
export default App;