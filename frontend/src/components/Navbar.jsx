import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Hàm chuyển đổi role tiếng Anh sang tiếng Việt để đồng bộ giao diện
  const getRoleLabel = (role) => {
    switch (role) {
      case 'PATIENT': return 'Bệnh nhân';
      case 'DOCTOR': return 'Bác sĩ';
      case 'ADMIN': return 'Quản trị viên';
      default: return role;
    }
  };

  const getBrandLink = () => {
    if (isAuthenticated) {
      if (user?.role === 'DOCTOR') return '/doctor/dashboard';
      if (user?.role === 'ADMIN') return '/admin/dashboard';
    }
    return '/';
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={getBrandLink()} className="navbar-brand">
          <img src="/images/logo.webp" alt="Logo Group 9" className="brand-logo-img" />
          <span className="brand-text">GROUP 9 - PHÒNG KHÁM ĐA KHOA</span>
        </Link>

        <nav className="navbar-menu">
          {/* TRANG CHỦ & BÁC SĨ: Hiển thị cho Khách và Bệnh nhân (PATIENT). 
              Ẩn đi đối với Bác sĩ (DOCTOR) và Quản trị viên (ADMIN). */}
          {user?.role !== 'DOCTOR' && user?.role !== 'ADMIN' && (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Trang chủ
              </Link>
              <Link
                to="/doctors"
                className={`nav-link ${isActive('/doctors') ? 'active' : ''}`}
              >
                Bác sĩ
              </Link>
            </>
          )}

          {/* LỊCH HẸN CỦA TÔI: Dành riêng cho Bệnh nhân */}
          {isAuthenticated && user?.role === 'PATIENT' && (
            <Link
              to="/my-appointments"
              className={`nav-link ${isActive('/my-appointments') ? 'active' : ''}`}
            >
              Lịch hẹn của tôi
            </Link>
          )}

          {/* LỊCH KHÁM PHỤ TRÁCH: Dành riêng cho Bác sĩ */}
          {isAuthenticated && user?.role === 'DOCTOR' && (
            <Link
              to="/doctor/dashboard"
              className={`nav-link ${isActive('/doctor/dashboard') ? 'active' : ''}`}
            >
              Lịch khám phụ trách
            </Link>
          )}

          {/* QUẢN TRỊ BÁC SĨ: Dành riêng cho Admin */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
            >
              Quản trị Bác sĩ
            </Link>
          )}
        </nav>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-profile">
              <span className="user-greeting">
                Xin chào, <strong>{user?.full_name}</strong>
                <span className="user-role-badge">{getRoleLabel(user?.role)}</span>
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm logout-btn"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm shadow-btn">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;