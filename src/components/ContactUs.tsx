import React, { useState, useRef, useEffect } from "react";
import { MapPin, Phone, Mail, Facebook, Instagram, Video, Clock, Navigation } from "lucide-react";
import { clean, isEmail, isName, isPhone, limitPhoneDigits, maxLength, minLength, phoneDigits } from "../lib/validation";

const ContactUsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-50px" }
    );

    const section = sectionRef.current;

    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        if (!clean(value)) return "Name is required";
        if (!isName(value)) return "Please enter a valid name";
        return "";

      case "email": {
        if (!clean(value)) return "Email is required";
        if (!isEmail(value)) return "Please enter a valid email";
        return "";
      }

      case "mobile": {
        if (!clean(value)) return "Mobile number is required";
        if (!isPhone(phoneDigits(value))) return "Please enter a valid 10 digit mobile number";
        return "";
      }

      case "message":
        if (!clean(value)) return "Message is required";
        if (!minLength(value, 10)) return "Message must be at least 10 characters";
        if (!maxLength(value, 500)) return "Message must be 500 characters or less";
        return "";

      default:
        return "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextValue = name === "mobile" ? limitPhoneDigits(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    if (touched[name]) {
      const error = validateField(name, nextValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      mobile: true,
      message: true,
    });

    // If validation errors exist, don't submit
    if (Object.keys(newErrors).length > 0) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill all the Fields'
      });
      return;
    }

    // Start submission
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Replace with your actual PHP endpoint URL
   const response = await fetch('https://cloudninebarandgrill.ca/backend/Contactformhandler.php', {
  //  const response = await fetch('http://localhost/cloud-nine/backend/Contactformhandler.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        setSubmitStatus({
          type: 'success',
          message: result.message || 'Thank you for contacting us! We will get back to you shortly.'
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          mobile: "",
          message: "",
        });
        setTouched({});
        setErrors({});

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: '' });
        }, 5000);
      } else {
        // Server-side validation errors or other errors
        if (result.errors) {
          setErrors(result.errors);
        }
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-b from-amber-900 to-neutral-900"
    >
      {/* Header with Background Image */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&h=600&fit=crop"
            alt="Contact Cloud Nine Ajax"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900 via-amber-800/80 to-amber-900/60"></div>
          <div className="absolute inset-0 bg-amber-800/40"></div>
        </div>

        <div className="relative text-center py-16 sm:py-20 md:py-24 px-4">
          <h1
            className={`text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            Visit Cloud Nine Bar & Grill in <span className="text-amber-600">Ajax</span>
          </h1>
          <p
            className={`text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto transition-all duration-1000 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            Looking for a restaurant near Bayly Street West in Ajax? We're easy to find and ready to serve you!
          </p>
          <div
            className={`flex items-center justify-center gap-2 mt-6 transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        
        {/* Primary Contact Info - Hero Style */}
        <div
          className={`mb-12 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-gradient-to-r from-amber-950/50 to-amber-900 border border-amber-900/30 rounded-2xl p-8 sm:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Location */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-full mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Visit Us</h3>
                <p className="text-gray-300 text-lg mb-3">
                  368 Bayly St W<br />
                  Ajax, ON L1S 1P1
                </p>
                <a
                  href="https://maps.google.com/?q=368+Bayly+St+W+Ajax+ON"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-semibold"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
              </div>

              {/* Phone */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-full mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Call Us</h3>
                <p className="text-gray-400 text-sm mb-2">
                  For reservations or inquiries
                </p>
                <a
                  href="tel:+19059036360"
                  className="text-white hover:text-amber-400 transition-colors text-2xl font-bold block"
                >
                  (905) 903-6360
                </a>
              </div>

              {/* Hours */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Hours</h3>
                <div className="text-gray-300 text-base space-y-1">
                  <p>Mon - Thu: 12:00 PM - 12:00 AM</p>
                  <p>Fri - Sat: 11:00 AM - 2:00 AM</p>
                  <p>Sunday: 11:00 AM - 12:00 AM</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t border-gray-800">
              <a
                href="tel:+19059036360"
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-amber-600/50 transition-all duration-300 hover:scale-105 text-center"
              >
                Call Now
              </a>
              <a
                href="https://maps.google.com/?q=368+Bayly+St+W+Ajax+ON"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold text-lg border border-gray-700 hover:bg-gray-700 transition-all duration-300 hover:scale-105 text-center"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left - Contact Info & Social */}
          <div
            className={`transition-all duration-1000 delay-500 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-10"
            }`}
          >
            {/* Contact Details Card */}
            <div className="bg-gradient-to-br from-gray-900 to-amber-900 rounded-2xl border border-gray-800 shadow-2xl p-6 sm:p-8 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                Get In Touch
              </h2>

              <div>
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-400 text-sm mb-1">Email</h3>
                    <a
                      href="mailto:cloudninemedia360@gmail.com"
                      className="text-white hover:text-amber-500 transition-colors text-base break-all"
                    >
                      cloudninemedia360@gmail.com
                    </a>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-4 border-t border-gray-800 mt-6">
                  <h3 className="text-white font-bold text-lg mb-3">Perfect for Ajax locals!</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">âœ“</span>
                      <span>Easy parking available</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">âœ“</span>
                      <span>Lunch & dinner service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">âœ“</span>
                      <span>Free party bookings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">âœ“</span>
                      <span>Walk-ins welcome</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Social Media Card */}
            <div className="bg-gradient-to-br from-gray-900 to-amber-900 rounded-2xl border border-gray-800 shadow-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-4">Follow Us</h3>
              <p className="text-gray-400 text-sm mb-6">
                Stay updated with our latest specials, events, and more!
              </p>
              <div className="flex gap-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  aria-label="Facebook"
                >
                  <Facebook className="w-7 h-7 text-white" />
                </a>
                <a
                  href="https://instagram.com/cloudnineajax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-gray-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  aria-label="Instagram"
                >
                  <Instagram className="w-7 h-7 text-white" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-gray-800 hover:bg-amber-800 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg border-2 border-transparent hover:border-cyan-400"
                  aria-label="TikTok"
                >
                  <Video className="w-7 h-7 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Right - Enquiry Form */}
          <div
            className={`transition-all duration-1000 delay-600 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }`}
          >
            <div className="bg-gradient-to-br from-gray-900 to-amber-900 rounded-2xl border border-gray-800 shadow-2xl p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                Send Us a Message
              </h2>

              {/* Status Messages */}
             

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2 text-sm">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    required
                    minLength={2}
                    maxLength={80}
                    pattern="[A-Za-z][A-Za-z .'-]{1,79}"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className={`w-full bg-amber-800 border ${
                      errors.name && touched.name
                        ? "border-amber-500"
                        : "border-gray-700"
                    } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-600 transition-colors placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.name && touched.name && (
                    <p className="text-amber-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    required
                    maxLength={120}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className={`w-full bg-amber-800 border ${
                      errors.email && touched.email
                        ? "border-amber-500"
                        : "border-gray-700"
                    } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-600 transition-colors placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.email && touched.email && (
                    <p className="text-amber-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2 text-sm">
                    Phone
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="+1"
                      readOnly
                      className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-gray-400 text-center cursor-not-allowed"
                    />
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="905-123-4567"
                      required
                      inputMode="numeric"
                      minLength={10}
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      value={formData.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`flex-1 bg-amber-800 border ${
                        errors.mobile && touched.mobile
                          ? "border-amber-500"
                          : "border-gray-700"
                      } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-600 transition-colors placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>
                  {errors.mobile && touched.mobile && (
                    <p className="text-amber-500 text-xs mt-1">{errors.mobile}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2 text-sm">
                    Message
                  </label>
                  <textarea
                    name="message"
                    placeholder="Tell us how we can help..."
                    required
                    minLength={10}
                    maxLength={500}
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    rows={5}
                    className={`w-full bg-amber-800 border ${
                      errors.message && touched.message
                        ? "border-amber-500"
                        : "border-gray-700"
                    } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-600 transition-colors resize-none placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.message && touched.message && (
                    <p className="text-amber-500 text-xs mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-amber-900/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
               {submitStatus.type && (
                <div
                  className={`my-4 p-4 rounded-lg border ${
                    submitStatus.type === 'success'
                      ? 'bg-green-900/20 border-green-600 text-green-400'
                      : 'bg-amber-900/20 border-amber-600 text-amber-400'
                  }`}
                >
                  <p className="text-sm font-medium">{submitStatus.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div
          className={`mt-12 transition-all duration-1000 delay-900 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="rounded-2xl overflow-hidden border-4 border-gray-900 shadow-2xl">
            <iframe
              className="w-full h-96 sm:h-[500px]"
              src="https://www.google.com/maps?q=368+Bayly+St+W+Ajax+ON&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cloud Nine Ajax Location Map"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUsSection;
