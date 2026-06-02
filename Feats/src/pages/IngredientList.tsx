import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axiosInstance from "../api/axiosInstance";
import "../components/IngredientList.css"; 
import type { Ingredient } from "../types/Fridge.ts";
import type { User } from "../types/User.ts";

const IngredientList: React.FC = () => {
    const navigate = useNavigate(); 
    const [items, setItems] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [dbCategories, setDbCategories] = useState<string[]>([]);

    // 등록 폼 상태값
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newStorage, setNewStorage] = useState("refrigerated");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editStorage, setEditStorage] = useState("refrigerated");

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const itemRes = await axiosInstance.get<Ingredient[]>("/product/search?name=");
            setItems(itemRes.data || []);

            const catRes = await axiosInstance.get<string[]>("/product/categories");
            const catData = catRes.data || [];
            setDbCategories(catData);
            if (catData.length > 0 && !newCategory) setNewCategory(catData[0]);
        } catch (err) {
            console.error("데이터 초기 수급 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem("user");
        
        if (!stored) {
            alert("접근 권한이 없습니다. 로그인이 필요합니다.");
            navigate("/", { replace: true }); 
            return;
        }

        const user: User = JSON.parse(stored);
        if (user.role !== "ADMIN") {
            alert("관리자 전용 페이지입니다. 일반 사용자는 진입할 수 없습니다.");
            navigate(-1); 
            return;
        }

        setIsAdmin(true);
        loadInitialData();
    }, [navigate]);

    
    const handleAdminRegister = (e: React.FormEvent) => { 
        e.preventDefault();
        if (!newName.trim()) return alert("재료명을 입력해 주세요.");
        if (!newCategory) return alert("카테고리를 선택해 주세요.");
        
        const payload = { name: newName, category: newCategory, type: newStorage };

        axiosInstance.post("/product/insert", payload) 
            .then(() => {
                alert(`[${newName}] 등록 완료`);
                setNewName("");
                loadInitialData();
            })
            .catch((err) => {
                console.error("등록 에러 디버깅:", err);
                alert("등록 실패");
            });
    };

    const startEdit = (item: Ingredient) => {
        setEditingId(item.id);
        setEditName(item.itemName || item.name || "");
        setEditCategory(item.category || dbCategories[0] || "기타");
    //     setEditStorage(item.storageType === "ROOM_TEMP" || item.storageType === "실온" ? "room" : 
    //                     item.storageType === "FROZEN" || item.storageType === "냉동" ? "frozen" : "refrigerated");
    // };
    const sType = (item.storageType || (item as any).type || "").toUpperCase();
    if (sType === "ROOM_TEMP" || sType === "ROOM" || sType === "실온") setEditStorage("room");
    else if (sType === "FROZEN" || sType === "냉동") setEditStorage("frozen");
    else setEditStorage("refrigerated");
  };

    const handleUpdateSubmit = (id: number) => {
        if (!editName.trim()) return alert("재료명을 입력하세요.");
        const payload = { name: editName, category: editCategory, type: editStorage };

        axiosInstance.post(`/product/master/update/${id}`, payload)
            .then(() => {
                alert("식재료 정보가 수정되었습니다.");
                setEditingId(null);
                loadInitialData();
            })
            .catch((err) => console.error(err));
    };

    const handleDeleteClick = (id: number, name: string) => {
        if (!window.confirm(`[${name}] 식재료를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        axiosInstance.post(`/product/master/delete/${id}`)
            .then(() => {
                alert("성공적으로 영구 삭제되었습니다.");
                loadInitialData();
            })
            .catch((err) => console.error(err));
    };

    if (!isAdmin) {
        return null; 
    }

    return (
        <div className="imf-root" style={{ padding: "20px" }}>
            <main className="imf-main">
                
                {/* 관리자 추가 등록 세션 */}
                {isAdmin && (
                    <div className="admin-register-box">
                        <h3 className="admin-box-title">DB 식재료 추가</h3>
                        <form onSubmit={handleAdminRegister} className="admin-form-layout">
                            <input type="text" placeholder="새로운 식재료명 입력" value={newName} onChange={(e) => setNewName(e.target.value)} className="admin-input-text" />
                            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="admin-select">
                                {dbCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                            </select>
                            <select value={newStorage} onChange={(e) => setNewStorage(e.target.value)} className="admin-select">
                                <option value="refrigerated">냉장 보관</option>
                                <option value="frozen">냉동 보관</option>
                                <option value="room">실온 보관</option>
                            </select>
                            <button type="submit" className="admin-btn-submit">DB 입력</button>
                        </form>
                    </div>
                )}

                {/* 전체 식재료 사전 카드 영역 */}
                <div className="section-card" style={{ padding: "24px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    <div className="ing-master-header-margin">
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b" }}>
                            전체 식재료 사전 ({items.length}종)
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <p className="ing-empty-text">DB에 데이터가 없습니다.</p>
                    ) : (
                        <div className="ing-master-grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px", width: "100%" }}>
                            {items.map((item) => {
                                const isEditing = editingId === item.id;
                                const currentName = item.itemName || item.name || "이름 없음";
                                const sType = (item.storageType || (item as any).type || "").toUpperCase();
                                
                                return (
                                    <div className="ing-master-item-box" key={item.id}>
                                        {isEditing ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%", padding: "4px", fontSize: "13px", border: "1px solid #6fbc44", borderRadius: "4px" }} />
                                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: "4px", fontSize: "12px", borderRadius: "4px" }}>
                                                    {dbCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                                                </select>
                                                <select value={editStorage} onChange={(e) => setEditStorage(e.target.value)} style={{ padding: "4px", fontSize: "12px", borderRadius: "4px" }}>
                                                    <option value="refrigerated">냉장</option>
                                                    <option value="frozen">냉동</option>
                                                    <option value="room">실온</option>
                                                </select>
                                                <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                                                    <button onClick={() => handleUpdateSubmit(item.id)} style={{ flex: 1, backgroundColor: "#6fbc44", color: "#fff", border: "none", padding: "4px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>저장</button>
                                                    <button onClick={() => setEditingId(null)} style={{ flex: 1, backgroundColor: "#94a3b8", color: "#fff", border: "none", padding: "4px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>취소</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="ing-master-text-name">{currentName}</div>
                    <div className="ing-master-badge-row">
                        <span className="ing-master-label cat">{item.category || "미분류"}</span>
                        <span className="ing-master-label store">
                            {/* 🟢 불필요한 한글/영어 혼용 조건문을 싹 밀어버리고 깔끔하게 매핑 */}
                            {sType === "ROOM_TEMP" || sType === "실온" ? "실온" : 
                             sType === "FROZEN" || sType === "냉동" ? "냉동" : "냉장"}
                        </span>
                    </div>
                                                
                                               
                                                {isAdmin && (
                                                    <div className="master-admin-action-row">
                                                        <button onClick={() => startEdit(item)} className="master-action-btn-edit">수정</button>
                                                        <button onClick={() => handleDeleteClick(item.id, currentName)} className="master-action-btn-delete">삭제</button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default IngredientList;