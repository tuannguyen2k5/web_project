import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Loading from '../components/Loading';
import { getDoctorImage } from '../utils/doctorImages';
import { AuthContext } from '../context/AuthContext';

const HERO_SLIDES = [
  {
    id: 1,
    specialty_id: 1,
    name: 'BS. CKII Nguyễn Văn An',
    specialty: 'Nội khoa',
    title: 'Trưởng khoa Nội tổng quát',
    experience: '12 năm kinh nghiệm',
    phone: '0901234567',
    desc: 'Chuyên gia đầu ngành về điều trị các bệnh mãn tính, tầm soát sức khỏe toàn diện và tư vấn phác đồ điều trị cá nhân hóa.',
    image: '/images/doctors/nguyen-van-an.png'
  },
  {
    id: 2,
    specialty_id: 2,
    name: 'ThS.BS Đặng Thị Mai',
    specialty: 'Nhi khoa',
    title: 'Bác sĩ Chuyên khoa Nhi',
    experience: '7 năm kinh nghiệm',
    phone: '0907654321',
    desc: 'Tận tâm, thấu hiểu tâm lý trẻ nhỏ, chuyên sâu về chăm sóc sơ sinh, dinh dưỡng và đồng hành cùng sự phát triển của bé.',
    image: '/images/doctors/dang-thi-mai.jpg'
  },
  {
    id: 3,
    specialty_id: 3,
    name: 'ThS.BS Lê Minh Cường',
    specialty: 'Da liễu',
    title: 'Bác sĩ Chuyên khoa Da liễu',
    experience: '10 năm kinh nghiệm',
    phone: '0912345678',
    desc: 'Chuyên sâu điều trị mụn trứng cá chuẩn y khoa, phục hồi màng bảo vệ da và ứng dụng công nghệ thẩm mỹ da hiện đại.',
    image: '/images/doctors/le-minh-cuong.jpg'
  },
  {
    id: 4,
    specialty_id: 4,
    name: 'PGS.TS Phạm Thu Hà',
    specialty: 'Tim mạch',
    title: 'Cố vấn Chuyên môn Tim mạch',
    experience: '15 năm kinh nghiệm',
    phone: '0934567890',
    desc: 'Chuyên gia Tim mạch đầu ngành về tầm soát cao huyết áp, bệnh mạch vành, suy tim và can thiệp điều trị tiên tiến.',
    image: '/images/doctors/pham-thu-ha.jpg'
  },
  {
    id: 5,
    specialty_id: 5,
    name: 'BS. CKI Hoàng Văn Đức',
    specialty: 'Tai Mũi Họng',
    title: 'Bác sĩ Chuyên khoa Tai Mũi Họng',
    experience: '9 năm kinh nghiệm',
    phone: '0945678901',
    desc: 'Nội soi kỹ thuật cao không đau, điều trị dứt điểm viêm xoang, viêm họng mãn tính, viêm amidan và các bệnh lý thanh quản.',
    image: '/images/doctors/hoang-van-duc.jpg'
  },
  {
    id: 6,
    specialty_id: 6,
    name: 'BS. CKI Vũ Thị Lan',
    specialty: 'Mắt',
    title: 'Bác sĩ Chuyên khoa Nhãn khoa',
    experience: '11 năm kinh nghiệm',
    phone: '0956789012',
    desc: 'Khám đo khúc xạ chuyên sâu, kiểm soát cận thị học đường, điều trị nhược thị và các bệnh lý giác mạc bảo vệ thị lực.',
    image: '/images/doctors/vu-thi-lan.png'
  }
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [docData, specData] = await Promise.all([
          api.getDoctors().catch(() => []),
          api.getSpecialties().catch(() => [])
        ]);
        setDoctors(docData || []);
        setSpecialties(specData || []);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu trang chủ:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="home-container">
      {/* 1. HERO SLIDER BANNER */}
      <section className="hero-slider-section" ref={heroRef}>
        <div
          className="hero-slider-bg"
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="hero-overlay"></div>
        </div>

        <div className="page-container hero-content-wrapper">
          <div className="hero-grid-showcase">
            <div className="hero-content">
              <div className="hero-tag">
                <span className="pulse-dot"></span>
                GROUP 9 - PHÒNG KHÁM ĐA KHOA CHẤT LƯỢNG CAO
              </div>

              <h1 className="hero-title">
                Đặt lịch khám chuyên nghiệp tại <br />
                <span className="highlight">Group 9 - Phòng khám đa khoa</span>
              </h1>

              <div className="hero-doctor-highlight">
                <div className="doctor-highlight-meta">
                  <span className="badge badge-hero-specialty">{slide.specialty}</span>
                  <span className="experience-tag">⏱️ {slide.experience}</span>
                  <span className="title-tag">· {slide.title}</span>
                </div>
                <h2 className="doctor-highlight-name">{slide.name}</h2>
                <p className="doctor-highlight-desc">{slide.desc}</p>
                {slide.phone && (
                  <div className="doctor-highlight-phone">
                    📞 Hotline tư vấn khoa {slide.specialty}: <strong>{slide.phone}</strong>
                  </div>
                )}
              </div>

              <div className="hero-cta-buttons">
                <Link to={`/book/${slide.id}`} className="btn btn-primary btn-lg shadow-btn">
                  Đặt khám với {slide.name}
                </Link>
                <Link to={`/doctors/${slide.id}`} className="btn btn-hero-outline btn-lg">
                  Xem thông tin
                </Link>
              </div>

              <div className="hero-dots">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>
            </div>

            <div className="hero-doctor-showcase">
              <div className="doctor-portrait-card">
                <div className="portrait-image-container">
                  <img src={slide.image} alt={slide.name} className="doctor-main-image" />
                  <div className="portrait-live-status">
                    <span className="live-dot-green"></span> Đang nhận lịch khám
                  </div>
                </div>
                <div className="portrait-caption">
                  <div className="portrait-doctor-name">{slide.name}</div>
                  <div className="portrait-doctor-title">{slide.title} · {slide.experience}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-stats-grid">
            <div className="stat-card">
              <div className="stat-number">6/6</div>
              <div className="stat-label">Chuyên khoa có bác sĩ phụ trách</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Tiếp nhận đăng ký lịch khám online</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Bác sĩ giàu kinh nghiệm điều trị</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0 phút</div>
              <div className="stat-label">Thời gian chờ khi đặt hẹn trước</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BÁC SĨ TIÊU BIỂU - ẨN ĐI KHI LÀ BỆNH NHÂN (PATIENT) */}
      {user?.role !== 'PATIENT' && (
        <section className="section featured-doctors-section">
          <div className="page-container">
            <div className="section-header">
              <div>
                <span className="sub-title">ĐỘI NGŨ Y BÁC SĨ</span>
                <h2>Bác Sĩ Phụ Trách Các Chuyên Khoa</h2>
                <p>Mỗi chuyên khoa tại Group 9 đều được phụ trách bởi bác sĩ chuyên môn vững vàng</p>
              </div>
              <Link to="/doctors" className="btn btn-primary btn-sm">
                Xem tất cả bác sĩ →
              </Link>
            </div>

            {loading ? (
              <Loading message="Đang tải danh sách bác sĩ..." />
            ) : (
              <div className="featured-doctors-grid">
                {doctors.map((doc) => {
                  const doctorPhoto = getDoctorImage(doc.id);
                  return (
                    <div key={doc.id} className="card doctor-home-card">
                      <div className="doctor-home-header">
                        {doctorPhoto ? (
                          <img src={doctorPhoto} alt={doc.full_name} className="doctor-thumb-photo" />
                        ) : (
                          <div className="avatar-circle">
                            {doc.full_name ? doc.full_name.charAt(0).toUpperCase() : 'B'}
                          </div>
                        )}
                        <div className="doctor-card-title-group">
                          <h3 className="doctor-home-name">
                            <Link to={`/doctors/${doc.id}`}>{doc.full_name}</Link>
                          </h3>
                          <span className="badge badge-specialty">{doc.specialty_name}</span>
                        </div>
                      </div>

                      <p className="doctor-home-desc">
                        {doc.description || 'Bác sĩ chuyên khoa giàu kinh nghiệm và tận tâm với bệnh nhân.'}
                      </p>

                      <div className="doctor-home-meta">
                        <span>⏱️ <strong>{doc.experience || 0} năm</strong> kinh nghiệm</span>
                        {doc.phone && <span>📞 {doc.phone}</span>}
                      </div>

                      <div className="doctor-home-actions">
                        <Link to={`/doctors/${doc.id}`} className="btn btn-outline btn-sm">
                          Xem thông tin
                        </Link>
                        <Link to={`/book/${doc.id}`} className="btn btn-primary btn-sm">
                          Đặt lịch khám
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. QUY TRÌNH ĐẶT LỊCH 4 BƯỚC (GIỮ NGUYÊN CHO TẤT CẢ) */}
      <section className="section process-section">
        <div className="page-container">
          <div className="section-header text-center">
            <span className="sub-title">QUY TRÌNH KHÁM BỆNH</span>
            <h2>Đặt Lịch Khám Thuận Tiện Trong 4 Bước</h2>
            <p>Trải nghiệm dịch vụ y tế hiện đại, văn minh tại Group 9 - Phòng khám đa khoa</p>
          </div>

          <div className="process-grid">
            <div className="process-step">
              <div className="step-badge">1</div>
              <div className="step-icon">
                <img src="/images/icons/icon-doctor.png" alt="Icon Bác sĩ" className="step-custom-icon" />
              </div>
              <h4>Chọn Bác Sĩ & Khoa</h4>
              <p>Chọn đúng bác sĩ chuyên khoa phụ trách dựa trên tình trạng và triệu chứng bệnh.</p>
            </div>

            <div className="process-step">
              <div className="step-badge">2</div>
              <div className="step-icon">
                <img src="/images/icons/icon-calendar.jpg" alt="Icon Ngày giờ" className="step-custom-icon" />
              </div>
              <h4>Chọn Ngày & Giờ</h4>
              <p>Chủ động chọn ngày khám và khung giờ ca sáng hoặc chiều phù hợp với thời gian biểu.</p>
            </div>

            <div className="process-step">
              <div className="step-badge">3</div>
              <div className="step-icon">
                <img src="/images/icons/icon-write.png" alt="Icon Triệu chứng" className="step-custom-icon" />
              </div>
              <h4>Mô Tả Triệu Chứng</h4>
              <p>Ghi chú triệu chứng ban đầu giúp bác sĩ chuẩn bị phác đồ và tài liệu khám tốt nhất.</p>
            </div>

            <div className="process-step">
              <div className="step-badge">4</div>
              <div className="step-icon">
                <img src="/images/logo.webp" alt="Logo Phòng Khám" className="step-custom-icon" />
              </div>
              <h4>Khám Bệnh Tại Phòng Khám</h4>
              <p>Đến phòng khám đúng giờ hẹn, vào thẳng phòng khám với bác sĩ mà không cần chờ đợi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BANNER CTA - ẨN KHI LÀ BỆNH NHÂN */}
      {user?.role !== 'PATIENT' && (
        <section className="cta-section">
          <div className="page-container cta-box">
            <div className="cta-content">
              <h2>Chăm Sóc Sức Khỏe Cho Bạn & Gia Đình Cùng Group 9</h2>
              <p>Đăng ký lịch khám ngay hôm nay để nhận được sự tư vấn chu đáo từ các bác sĩ chuyên khoa đầu ngành.</p>
            </div>
            <div className="cta-actions">
              <Link to="/doctors" className="btn btn-primary btn-lg shadow-btn">
                Xem danh sách bác sĩ
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg" style={{ background: '#fff' }}>
                Đăng ký tài khoản bệnh nhân
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 6. FOOTER */}
      <footer className="main-footer">
        <div className="page-container footer-content">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <img src="/images/logo.webp" alt="Logo Group 9" className="brand-logo-img" />
              <span className="brand-text">Group 9 - Phòng khám đa khoa</span>
            </div>
            <p>Hệ thống đặt lịch khám bệnh trực tuyến hiện đại, kết nối bệnh nhân trực tiếp với các bác sĩ chuyên khoa giàu kinh nghiệm.</p>
          </div>
          <div className="footer-col">
            <h4>Liên Kết Nhanh</h4>
            <ul>
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/doctors">Đội ngũ bác sĩ</Link></li>
              <li><Link to="/login">Đăng nhập tài khoản</Link></li>
              <li><Link to="/register">Đăng ký bệnh nhân</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Thời Gian Làm Việc</h4>
            <ul>
              <li>Thứ Hai - Thứ Sáu: 07:30 - 20:00</li>
              <li>Thứ Bảy & Chủ Nhật: 08:00 - 17:30</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Địa Chỉ Phòng Khám</h4>
            <ul>
              <li>📍 Số 123 Đường Y Dược, Hoàn Kiếm, Hà Nội</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="page-container">
            <p>© 2026 Group 9 - Phòng khám đa khoa</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;